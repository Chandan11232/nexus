package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/docuflow/api/internal/handler"
	"github.com/docuflow/api/internal/middleware"
	"github.com/docuflow/api/internal/repository"
	"github.com/docuflow/api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/streadway/amqp"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Database connections
	dbPool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	readPool, err := pgxpool.New(ctx, os.Getenv("DATABASE_READ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to read replica: %v", err)
	}
	defer readPool.Close()

	// Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
	})
	defer redisClient.Close()

	// RabbitMQ
	rabbitConn, err := amqp.Dial(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitConn.Close()

	// Repositories
	docRepo := repository.NewDocumentRepository(dbPool, readPool)
	userRepo := repository.NewUserRepository(dbPool)
	orgRepo := repository.NewOrganizationRepository(dbPool)
	analyticsRepo := repository.NewAnalyticsRepository(readPool)

	// Services
	docService := service.NewDocumentService(docRepo, orgRepo, rabbitConn)
	authService := service.NewAuthService(userRepo, os.Getenv("JWT_SECRET"), os.Getenv("JWT_REFRESH_SECRET"))
	wsService := service.NewWebSocketService(docRepo, redisClient)
	analyticsService := service.NewAnalyticsService(analyticsRepo, redisClient)

	// Handlers
	docHandler := handler.NewDocumentHandler(docService, wsService)
	authHandler := handler.NewAuthHandler(authService)
	wsHandler := handler.NewWebSocketHandler(wsService)
	healthHandler := handler.NewHealthHandler(dbPool, redisClient, rabbitConn)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)

	// Gin setup
	if os.Getenv("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())
	r.Use(middleware.RequestID())

	// Health
	r.GET("/health", healthHandler.Health)
	r.GET("/ready", healthHandler.Ready)

	// API routes
	api := r.Group("/api/v1")
	{
		// Auth
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.Refresh)
		api.POST("/auth/logout", authHandler.Logout)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.Auth(authService))
		{
			// Organizations
			protected.POST("/organizations", authHandler.CreateOrganization)
			protected.GET("/organizations/:id", authHandler.GetOrganization)
			protected.PATCH("/organizations/:id", authHandler.UpdateOrganization)

			// Documents
			protected.POST("/documents", docHandler.CreateDocument)
			protected.GET("/documents", docHandler.ListDocuments)
			protected.GET("/documents/:id", docHandler.GetDocument)
			protected.PATCH("/documents/:id", docHandler.UpdateDocument)
			protected.DELETE("/documents/:id", docHandler.DeleteDocument)
			protected.POST("/documents/:id/publish", docHandler.PublishDocument)
			protected.POST("/documents/:id/export", docHandler.ExportDocument)

			// WebSocket for real-time editing
			protected.GET("/documents/:id/ws", wsHandler.HandleWebSocket)

			// Analytics
			protected.GET("/analytics/documents/:id", analyticsHandler.GetDocumentAnalytics)
			protected.GET("/analytics/organizations/:id", analyticsHandler.GetOrganizationAnalytics)
		}

		// Internal job endpoints (for cron)
		internal := api.Group("/internal")
		internal.Use(middleware.InternalAuth(os.Getenv("INTERNAL_JOB_TOKEN")))
		{
			internal.POST("/jobs/analytics-rollup", analyticsHandler.RollupAnalytics)
			internal.POST("/jobs/search-reindex", analyticsHandler.ReindexSearch)
			internal.POST("/jobs/cleanup-temp", analyticsHandler.CleanupTemp)
			internal.POST("/jobs/ai-summary-batch", analyticsHandler.BatchAISummary)
			internal.POST("/jobs/replica-lag-check", healthHandler.CheckReplicaLag)
		}
	}

	// WebSocket upgrade handler (outside auth middleware for custom auth)
	r.GET("/ws/documents/:id", wsHandler.HandleWebSocket)

	// Server
	srv := &http.Server{
		Addr:    ":" + getEnv("PORT", "8080"),
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("Shutting down server...")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Fatalf("Server forced to shutdown: %v", err)
		}
	}()

	log.Printf("Server starting on port %s", getEnv("PORT", "8080"))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}

	log.Println("Server exited")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}