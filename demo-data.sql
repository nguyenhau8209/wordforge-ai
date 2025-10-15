-- Demo data for WordForge AI
-- Run this after setting up the database

-- Insert a demo user (you'll need to replace with actual user ID from NextAuth)
-- INSERT INTO "User" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
-- VALUES ('demo-user-1', 'Demo User', 'demo@example.com', NOW(), NOW(), NOW());

-- Insert demo decks
-- INSERT INTO "Deck" (id, name, description, "userId", "createdAt", "updatedAt")
-- VALUES 
--   ('demo-deck-1', 'Từ vựng TOEIC cơ bản', 'Bộ từ vựng TOEIC cơ bản cho người mới bắt đầu', 'demo-user-1', NOW(), NOW()),
--   ('demo-deck-2', 'Từ vựng IELTS', 'Từ vựng IELTS theo chủ đề', 'demo-user-1', NOW(), NOW());

-- Insert demo flashcards
-- INSERT INTO "Flashcard" (id, front, back, pronunciation, "audioUrl", "imageUrl", example, difficulty, "deckId", "createdAt", "updatedAt")
-- VALUES 
--   ('demo-card-1', 'abundant', 'existing in large quantities; plentiful', '/əˈbʌndənt/', NULL, NULL, 'The region has abundant natural resources.', 2, 'demo-deck-1', NOW(), NOW()),
--   ('demo-card-2', 'acquire', 'to gain or obtain something through effort or experience', '/əˈkwaɪər/', NULL, NULL, 'She acquired a new skill through practice.', 3, 'demo-deck-1', NOW(), NOW()),
--   ('demo-card-3', 'analyze', 'to examine in detail to understand structure or meaning', '/ˈænəlaɪz/', NULL, NULL, 'Scientists analyze data to find patterns.', 2, 'demo-deck-2', NOW(), NOW());

-- Note: This is just an example. In practice, you would create users through NextAuth
-- and flashcards through the AI API endpoints.
