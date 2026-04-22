-- USE
USE drifthub;

-- VIEWS
-- View Get Users
DROP VIEW IF EXISTS get_users;
CREATE VIEW get_users AS
SELECT
    BIN_TO_UUID(id, 1) AS id,
    username,
    email,
    `role`,
    birthDate,
    createdAt,
    updatedAt
FROM users
WHERE isDeleted = 0;

-- View Get Public Profiles
DROP VIEW IF EXISTS get_public_profiles;
CREATE VIEW get_public_profiles AS
SELECT 
    BIN_TO_UUID(u.id, 1) AS id,
    u.username,
    u.`role`,
    u.createdAt,
    IF(up.showEmail = 1, u.email, NULL) AS email,
    IF(up.showBirthDate = 1, u.birthDate, NULL) AS birthDate,
    up.bio,
    up.profileImage,
    up.showEmail,
    up.showBirthDate
FROM users u
LEFT JOIN user_profiles up ON u.id = up.userID
WHERE u.isDeleted = 0;

-- View Get Topics
DROP VIEW IF EXISTS get_topics;
CREATE VIEW get_topics AS 
SELECT 
    BIN_TO_UUID(t.id, 1) AS id,
    BIN_TO_UUID(t.userID, 1) AS userID,
    CASE 
        WHEN u.isDeleted 
        OR u.id IS NULL THEN '[Deleted User]'
        ELSE u.username 
    END AS username,
    t.title, 
    t.content, 
    t.createdAt,
    t.updatedAt,
    t.commentCount
FROM topics t
LEFT JOIN users u ON t.userID = u.id
WHERE NOT t.isDeleted;

-- View Get Deleted Topics
DROP VIEW IF EXISTS get_deleted_topics;
CREATE VIEW get_deleted_topics AS 
SELECT 
    BIN_TO_UUID(t.id, 1) AS id,
    BIN_TO_UUID(t.userID, 1) AS userID,
    u.username AS username,
    t.title, 
    t.content, 
    t.createdAt,
    t.updatedAt,
    t.deletedAt,
    t.commentCount
FROM topics t
LEFT JOIN users u ON t.userID = u.id
WHERE t.isDeleted = 1;

-- View Get Comments
DROP VIEW IF EXISTS get_comments;
CREATE VIEW get_comments AS
SELECT
    BIN_TO_UUID(c.id, 1) AS id,
    BIN_TO_UUID(c.topicID, 1) AS topicID,
    BIN_TO_UUID(c.userID, 1) AS userID,
    CASE 
        WHEN u.isDeleted 
        OR u.id IS NULL THEN '[Deleted User]'
        ELSE u.username 
    END AS username,
    c.body,
    c.createdAt,
    c.updatedAt,
    c.likeCount as likes,
    c.dislikeCount as dislikes
FROM comments c
LEFT JOIN users u ON c.userID = u.id
WHERE NOT c.isDeleted;
