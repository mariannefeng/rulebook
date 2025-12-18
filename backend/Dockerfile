FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git (required for go modules)
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

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

