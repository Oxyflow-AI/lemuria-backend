# Astrology Chat Backend API Tests
# All cURL commands executed during testing

## Server Health Check
curl -s http://localhost:3000/api/health

## Authentication Flow Tests

# 1. Try sign in with non-existent email - Should prompt invalid email or password
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "password123#"}'

# 2. Create new user account
curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "password123*"}'

# 3. Try sign in before email verification with correct password - Should prompt for email verification
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "password123*"}'

# 4. Try sign in before email verification with wrong password - Should prompt for email verification, not invalid password
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "wrongpassword"}'

# 5. Try sign up with same email and different password - Should generate new email verification
curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "password123#"}'

# 6. After manual email verification - Try sign in with wrong password
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "wrongpassword"}'

# 7. Sign in with correct credentials after verification - Should get JWT token
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "oxyflowai@gmail.com", "password": "password123*"}'

# Save the JWT token for subsequent requests
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6InlSdFNtOWVuMTJpem1ZZGYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3FvdGl3ZHFmY3VncWpwb2Jrd2NkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzYWM0MmUyOS0zMTBmLTQzNzQtOTJkYi1hODJmMjU5OTBkNjkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUxMTkwMTgwLCJpYXQiOjE3NTExODY1ODAsImVtYWlsIjoib3h5Zmxvd2FpQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJveHlmbG93YWlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiM2FjNDJlMjktMzEwZi00Mzc0LTkyZGItYTgyZjI1OTkwZDY5In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTExODY1ODB9XSwic2Vzc2lvbl9pZCI6ImM3NmU3YWZiLWI2ZmQtNGZkNy1hNDNiLTJlZGZjOGVkMDQ0ZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.xYx2gisiiX2f4WzrGj7st0Kf523kj3LvzkKV4H5DH_U"

## Account Settings Tests

# 8. Set astrology system to VEDIC and preferred language to TAMIL
curl -s -X PUT http://localhost:3000/api/account-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"astrology_system": "VEDIC", "preferred_language": "TAMIL"}'

# 9. Check account settings (should have astrology_system: VEDIC, preferred_language: TAMIL, primary_profile: NULL)
curl -s -X GET http://localhost:3000/api/account-settings \
  -H "Authorization: Bearer $JWT_TOKEN"

## Primary Profile Creation Tests

# 10. Create profile for Vishal K with birth details
curl -s -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "firstname": "Vishal",
    "lastname": "K",
    "gender": "MALE",
    "date_of_birth": "2004-08-02",
    "time_of_birth": "08:30:00",
    "place_of_birth": "Coimbatore India",
    "calculate_astrology": true,
    "astrology_system": "VEDIC"
  }'

# 11. Check all profiles (Vishal profile should have Rasi: Kumbha, Nakshatra: Dhanishta)
curl -s -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer $JWT_TOKEN"

# 12. Check account settings for primary_profile (should still be null - trigger issue)
curl -s -X GET http://localhost:3000/api/account-settings \
  -H "Authorization: Bearer $JWT_TOKEN"

# 13. Create second profile for Dhanwanth
curl -s -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "firstname": "Dhanwanth",
    "gender": "MALE",
    "vedic_rasi": "Mithuna",
    "vedic_nakshatra": "Mrigashira"
  }'

# 14. Check all profiles again (should have Dhanwanth with Rasi: Mithuna, Nakshatra: Mrigashira)
curl -s -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer $JWT_TOKEN"

# 15. Set Dhanwanth as primary profile (profile_id: 4)
curl -s -X PUT http://localhost:3000/api/account-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"primary_profile": 4}'

# 16. Verify account settings updated (primary_profile should be 4)
curl -s -X GET http://localhost:3000/api/account-settings \
  -H "Authorization: Bearer $JWT_TOKEN"

## 🚀 Primary Chat Testing Commands - Unified Endpoint (Profile ID: 2)

# 17. Ask about marriage timing (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "When will I get married according to my birth chart? What planetary periods are favorable?", "profile_id": 2}'

# 18. Ask about career prospects (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What career path suits me best? Should I focus on business or service?", "profile_id": 2}'

# 19. Ask about health concerns (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What health issues should I be careful about based on my chart? Any remedies?", "profile_id": 2}'

# 20. Ask about relationships (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What type of romantic partner is most compatible with me? When should I expect love?", "profile_id": 2}'

# 21. Ask about personal growth (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "How can I achieve spiritual growth and unlock my highest potential?", "profile_id": 2}'

# 22. Ask about finances (system determined by account settings)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What does my chart say about my financial future and wealth prospects?", "profile_id": 2}'

## Chat History and Message Management (Unified Endpoint)

# 23. Get chat history using unified endpoint
curl -s -X GET "http://localhost:3000/api/chat/history?profile_id=2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 24. Get chat history with pagination
curl -s -X GET "http://localhost:3000/api/chat/history?profile_id=2&limit=5&offset=0" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 25. Get specific message by ID (replace MESSAGE_ID with actual ID)
curl -s -X GET "http://localhost:3000/api/chat/messages/MESSAGE_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 26. Update a message (replace MESSAGE_ID with actual ID)
curl -s -X PUT "http://localhost:3000/api/chat/messages/MESSAGE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What does my birth chart say about relationships and love?"}'

# 27. Delete a message (replace MESSAGE_ID with actual ID)
curl -s -X DELETE "http://localhost:3000/api/chat/messages/MESSAGE_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"

## 🔧 Legacy System-Specific Endpoints (For Testing/Comparison)

# 28. Force Vedic system - marriage timing
curl -s -X POST http://localhost:3000/api/vedic-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "When will I get married according to Vedic astrology?", "profile_id": 2}'

# 29. Force Western system - relationships
curl -s -X POST http://localhost:3000/api/western-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What type of partner is compatible with my zodiac sign?", "profile_id": 2}'

# 30. Get Vedic-specific chat history
curl -s -X GET "http://localhost:3000/api/vedic-chat/history?profile_id=2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 31. Get Western-specific chat history
curl -s -X GET "http://localhost:3000/api/western-chat/history?profile_id=2" \
  -H "Authorization: Bearer $JWT_TOKEN"

## 🎯 Quick Test Sequence

# 32. Test unified endpoint - general question
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "What does my birth chart reveal about my personality?", "profile_id": 2}'

# 33. Test unified endpoint - timing question
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "Is this a good time to start a new business venture?", "profile_id": 2}'

# 34. Test unified endpoint - compatibility question
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "How compatible am I with someone born in March?", "profile_id": 2}'

# 35. Get all chat history with sorting
curl -s -X GET "http://localhost:3000/api/chat/history?profile_id=2&sortBy=created_at&sortOrder=desc" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 36. Get recent chat messages only
curl -s -X GET "http://localhost:3000/api/chat/history?profile_id=2&limit=3" \
  -H "Authorization: Bearer $JWT_TOKEN"
