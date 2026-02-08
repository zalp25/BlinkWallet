$env:MYSQL_DSN = "root:1234@tcp(localhost:3306)/blinkwallet?parseTime=true&charset=utf8mb4"
go run .\rates.go
