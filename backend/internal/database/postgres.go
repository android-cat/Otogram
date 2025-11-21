package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	var err error
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	// Retry connection logic for Docker startup timing
	for i := 0; i < 5; i++ {
		DB, err = sql.Open("postgres", connStr)
		if err == nil {
			err = DB.Ping()
		}

		if err == nil {
			log.Println("Successfully connected to the database")
			return
		}

		log.Printf("Failed to connect to database (attempt %d/5): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}

	log.Fatal("Could not connect to database after multiple attempts")
}
