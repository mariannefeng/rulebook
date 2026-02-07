FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git (required for go modules)
RUN apk add --no-cache git

# Install ghostscript (required for converting PDFs with JPX to JPEG)
RUN apk add --no-cache ghostscript

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Generate Swagger docs (run the swag generator; same module already in go.mod)
RUN go run github.com/swaggo/swag/cmd/swag@v1.8.10 init

# Build the Go app
RUN go build -o backend main.go

# Start a new, minimal image
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy the compiled Go binary from the builder
COPY --from=builder /app/backend .

# Copy any files needed at runtime (e.g., .env optionally)
# COPY .env .   # Uncomment this if you use a .env file

EXPOSE 8080

CMD ["./backend"]

