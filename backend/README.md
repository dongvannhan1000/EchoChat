
Nếu bạn đang sử dụng session để quản lý xác thực thay vì JWT, bạn không cần phải gửi token trong header. Dưới đây là các lệnh cURL đã được điều chỉnh cho phù hợp với việc sử dụng session:

curl -X POST http://localhost:5000/api/login \
-H "Content-Type: application/json" \
-d '{
  "email": "testuser@example.com",
  "password": "password123"
}' --cookie-jar cookies.txt

curl -X POST http://localhost:5000/api/posts \
-H "Content-Type: application/json" \
--cookie "connect.sid=$(grep connect.sid cookies.txt | awk '{print $NF}')" \
-d '{
  "title": "Title",
  "content": "Content",
  "authorId": "dce5e29d-3d76-4b6f-9121-508a40f81e53"
}'

curl -X POST http://localhost:5000/api/logout \
--cookie "connect.sid=$(grep connect.sid cookies.txt | awk '{print $NF}')"

curl -X GET http://localhost:5000/api/posts \
--cookie "connect.sid=$(grep connect.sid cookies.txt | awk '{print $NF}')"