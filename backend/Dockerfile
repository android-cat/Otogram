FROM golang:1.21-alpine

WORKDIR /app

COPY go.mod ./
COPY . .

RUN go mod tidy
RUN go mod download
RUN go build -o main ./cmd/api

EXPOSE 8080

CMD ["/app/main"]
