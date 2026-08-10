package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/streadway/amqp"
)

type HealthHandler struct {
	dbPool    *pgxpool.Pool
	redis     *redis.Client
	rabbitMQ  *amqp.Connection
}

func NewHealthHandler(dbPool *pgxpool.Pool, redis *redis.Client, rabbitMQ *amqp.Connection) *HealthHandler {
	return &HealthHandler{
		dbPool:   dbPool,
		redis:    redis,
		rabbitMQ: rabbitMQ,
	}
}

func (h *HealthHandler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	checks := map[string]string{
		"status": "healthy",
		"time":   time.Now().UTC().Format(time.RFC3339),
	}

	// Database
	if err := h.dbPool.Ping(ctx); err != nil {
		checks["database"] = "unhealthy: " + err.Error()
		checks["status"] = "degraded"
	} else {
		checks["database"] = "healthy"
	}

	// Redis
	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["redis"] = "unhealthy: " + err.Error()
		checks["status"] = "degraded"
	} else {
		checks["redis"] = "healthy"
	}

	// RabbitMQ
	if h.rabbitMQ.IsClosed() {
		checks["rabbitmq"] = "unhealthy: connection closed"
		checks["status"] = "degraded"
	} else {
		checks["rabbitmq"] = "healthy"
	}

	statusCode := http.StatusOK
	if checks["status"] == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, checks)
}

func (h *HealthHandler) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// More thorough checks for readiness
	if err := h.dbPool.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database unavailable",
		})
		return
	}

	if err := h.redis.Ping(ctx).Err(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "redis unavailable",
		})
		return
	}

	if h.rabbitMQ.IsClosed() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "rabbitmq unavailable",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *HealthHandler) CheckReplicaLag(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var alerts []map[string]interface{}

	rows, err := h.dbPool.Query(ctx, `
		SELECT 
			client_addr,
			state,
			pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) as lag_bytes,
			EXTRACT(EPOCH FROM (now() - backend_start)) as connection_age
		FROM pg_stat_replication
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var clientAddr, state string
		var lagBytes int64
		var connectionAge float64

		if err := rows.Scan(&clientAddr, &state, &lagBytes, &connectionAge); err != nil {
			continue
		}

		// Estimate lag in seconds (assuming ~10MB/s throughput)
		lagMB := float64(lagBytes) / (1024 * 1024)
		estimatedLag := lagMB / 10

		if estimatedLag > 5 {
			alerts = append(alerts, map[string]interface{}{
				"client":                clientAddr,
				"lag_bytes":             lagBytes,
				"estimated_lag_seconds": estimatedLag,
				"state":                 state,
				"connection_age":        connectionAge,
			})
		}
	}

	response := map[string]interface{}{
		"status":          "checked",
		"replicas_count":  len(alerts) + 1, // rough estimate
		"alerts":          alerts,
		"checked_at":      time.Now().UTC().Format(time.RFC3339),
	}

	if len(alerts) > 0 {
		c.JSON(http.StatusOK, response)
	} else {
		c.JSON(http.StatusOK, response)
	}
}