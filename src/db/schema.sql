DROP DATABASE IF EXISTS drifthub;
CREATE DATABASE drifthub;

USE drifthub;

-- TABLES
-- Table Users
DROP TABLE IF EXISTS users;
CREATE TABLE users(
	id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('User', 'Administrator') DEFAULT 'User',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    isDeleted TINYINT DEFAULT 0,
    deletedAt TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT chk_email CHECK (email REGEXP('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'))
);

-- Table User Profiles
DROP TABLE IF EXISTS user_profiles;
CREATE TABLE user_profiles (
    userID BINARY(16) PRIMARY KEY,
    bio TEXT,
    profileImage LONGTEXT,
    FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE
);

-- Table Topics
DROP TABLE IF EXISTS topics;
CREATE TABLE topics(
	id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
    userID BINARY(16) NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    commentCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    isDeleted TINYINT DEFAULT 0,
    deletedAt TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_title (title),
    FOREIGN KEY(userID) REFERENCES users(id) ON DELETE SET NULL
);

-- Table Comments
DROP TABLE IF EXISTS comments;
CREATE TABLE comments(
	id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
    topicID BINARY(16),
    userID BINARY(16) NULL,
    body TEXT NOT NULL,
    likeCount INT DEFAULT 0,
    dislikeCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isDeleted TINYINT DEFAULT 0,
    deletedAt TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_topic_created (topicID, createdAt),
    FOREIGN KEY(topicID) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY(userID) REFERENCES users(id) ON DELETE SET NULL
);

-- Table Likes
DROP TABLE IF EXISTS likes;
CREATE TABLE likes(
	userID BINARY(16) NOT NULL,
    commentID BINARY(16) NOT NULL,
    `type` ENUM('like', 'dislike') NOT NULL,
    INDEX idx_comment_type (commentID, `type`),
    PRIMARY KEY(userID, commentID),
    FOREIGN KEY(userID) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(commentID) REFERENCES comments(id) ON DELETE CASCADE
);

-- Table Tags
DROP TABLE IF EXISTS tags;
CREATE TABLE tags(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
);

-- Table Topic Tags
DROP TABLE IF EXISTS topic_tags;
CREATE TABLE topic_tags(
	topicID BINARY(16) NOT NULL,
    tagID INT NOT NULL,
    PRIMARY KEY(topicID, tagID),
    FOREIGN KEY(topicID) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY(tagID) REFERENCES tags(id) ON DELETE CASCADE
);

-- TRIGGERS
-- Trigger Before User Update
DELIMITER //
DROP TRIGGER IF EXISTS before_user_update//
CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.isDeleted = 1 AND OLD.isDeleted = 0 THEN
        SET NEW.deletedAt = NOW();
    ELSEIF NEW.isDeleted = 0 AND OLD.isDeleted = 1 THEN
        SET NEW.deletedAt = NULL;
    END IF;
END //
DELIMITER ;

-- Trigger Before Topic Update
DELIMITER //
DROP TRIGGER IF EXISTS before_topic_update//
CREATE TRIGGER before_topic_update
BEFORE UPDATE ON topics
FOR EACH ROW
BEGIN
    IF NEW.isDeleted = 1 AND OLD.isDeleted = 0 THEN
        SET NEW.deletedAt = NOW();
    ELSEIF NEW.isDeleted = 0 AND OLD.isDeleted = 1 THEN
        SET NEW.deletedAt = NULL;
    END IF;
END //
DELIMITER ;

-- Trigger After Comment Insert
DELIMITER //
DROP TRIGGER IF EXISTS after_comment_insert//
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE topics 
    SET commentCount = commentCount + 1
    WHERE id = NEW.topicID;
END //
DELIMITER ;

-- Trigger Before Comment Update
DELIMITER //
DROP TRIGGER IF EXISTS before_comment_update//
CREATE TRIGGER before_comment_update
BEFORE UPDATE ON comments
FOR EACH ROW
BEGIN
    IF NEW.isDeleted = 1 AND OLD.isDeleted = 0 THEN
        SET NEW.deletedAt = NOW();
    ELSEIF NEW.isDeleted = 0 AND OLD.isDeleted = 1 THEN
        SET NEW.deletedAt = NULL;
    END IF;
    
    IF NEW.body <> OLD.body THEN
        SET NEW.updatedAt = NOW();
    END IF;
END //
DELIMITER ;

-- Trigger After Comment Update
DELIMITER //
DROP TRIGGER IF EXISTS after_comment_update//
CREATE TRIGGER after_comment_update
AFTER UPDATE ON comments
FOR EACH ROW
BEGIN
    IF NEW.isDeleted = 1 AND OLD.isDeleted = 0 THEN
        UPDATE topics
        SET commentCount = commentCount - 1
        WHERE id = NEW.topicID;
    ELSEIF NEW.isDeleted = 0 AND OLD.isDeleted = 1 THEN
        UPDATE topics
        SET commentCount = commentCount + 1
        WHERE id = NEW.topicID;
    END IF;
END //
DELIMITER ;

-- Trigger After Comment Delete
DELIMITER //
DROP TRIGGER IF EXISTS after_comment_delete//
CREATE TRIGGER after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE topics 
    SET commentCount = commentCount - 1
    WHERE id = OLD.topicID;
END //
DELIMITER ;

-- Trigger After Like Insert
DELIMITER //
DROP TRIGGER IF EXISTS after_like_insert//
CREATE TRIGGER after_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    IF NEW.`type` = 'like' THEN
        UPDATE comments SET likeCount = likeCount + 1 WHERE id = NEW.commentID;
    ELSE
        UPDATE comments SET dislikeCount = dislikeCount + 1 WHERE id = NEW.commentID;
    END IF;
END //
DELIMITER ;

-- Trigger After Like Update
DELIMITER //
DROP TRIGGER IF EXISTS after_like_update//
CREATE TRIGGER after_like_update
AFTER UPDATE ON likes
FOR EACH ROW
BEGIN
    IF OLD.type = 'like' AND NEW.type = 'dislike' THEN
        UPDATE comments 
        SET likeCount = likeCount - 1, 
            dislikeCount = dislikeCount + 1 
        WHERE id = NEW.commentID;
        
    -- Se mudou de DISLIKE para LIKE
    ELSEIF OLD.type = 'dislike' AND NEW.type = 'like' THEN
        UPDATE comments 
        SET dislikeCount = dislikeCount - 1, 
            likeCount = likeCount + 1 
        WHERE id = NEW.commentID;
    END IF;
END //
DELIMITER ;

-- Trigger After Like Delete
DELIMITER //
DROP TRIGGER IF EXISTS after_like_delete//
CREATE TRIGGER after_like_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    IF OLD.type = 'like' THEN
        UPDATE comments SET likeCount = likeCount - 1 WHERE id = OLD.commentID;
    ELSE
        UPDATE comments SET dislikeCount = dislikeCount - 1 WHERE id = OLD.commentID;
    END IF;
END //
DELIMITER ;

-- VIEWS

-- View Get Users
DROP VIEW IF EXISTS get_users;
CREATE VIEW get_users AS
SELECT
    BIN_TO_UUID(id, 1) AS id,
    username,
    email,
    `role`,
    createdAt,
    updatedAt
FROM users
WHERE isDeleted = 0;

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

-- PROCEDURES
-- Procedure Create User
DELIMITER //
DROP PROCEDURE IF EXISTS create_user//
CREATE PROCEDURE create_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255)
)
BEGIN
	DECLARE v_userID BINARY(16);
    DECLARE v_isDeleted TINYINT(1);
    SELECT id, isDeleted INTO v_userID, v_isDeleted FROM users
    WHERE email = p_email LIMIT 1;
    
    IF v_isDeleted IS NULL THEN
        INSERT INTO users (username, email, `password`)
        VALUES (p_username, p_email, p_password_hash);
        
        SELECT BIN_TO_UUID(id, 1) AS id FROM users WHERE email = p_email;
    ELSEIF v_isDeleted = 1 THEN
        UPDATE users 
        SET isDeleted = 0,
            username = p_username,
            `password` = p_password_hash
        WHERE email = p_email;
        
        SELECT BIN_TO_UUID(v_userId, 1) AS id;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This email is already registered and active.';
    END IF;
END //
DELIMITER ;

-- Procedure Get Topics Paginated
DELIMITER //
DROP PROCEDURE IF EXISTS get_topics_paginated //
CREATE PROCEDURE get_topics_paginated(
    IN p_search VARCHAR(100),
    IN p_limit INT,
    IN p_offset INT,
    IN p_sort VARCHAR(4)
)
BEGIN
    SELECT COUNT(*) AS total 
    FROM topics 
    WHERE isDeleted = 0 AND title LIKE CONCAT('%', p_search, '%');
    
    IF p_sort = "DESC" THEN
		SELECT * FROM get_topics 
		WHERE title LIKE CONCAT('%', p_search, '%')
		ORDER BY createdAt DESC
		LIMIT p_limit OFFSET p_offset;
	ELSE
		SELECT * FROM get_topics 
		WHERE title LIKE CONCAT('%', p_search, '%')
		ORDER BY createdAt ASC
		LIMIT p_limit OFFSET p_offset;
    END IF;
END //
DELIMITER ;

-- Procedure Create Topic
DELIMITER //
DROP PROCEDURE IF EXISTS create_topic//
CREATE PROCEDURE create_topic(
	IN p_userID VARCHAR(36),
    IN p_title VARCHAR(100),
    IN p_content TEXT
)
BEGIN
    INSERT INTO topics (title, content, userID)
    VALUES (
        p_title, 
        p_content,
        UUID_TO_BIN(p_userID, 1)
    );

    SELECT BIN_TO_UUID(id, 1) AS id 
	FROM topics 
	WHERE userID = UUID_TO_BIN(p_userID, 1) 
	ORDER BY createdAt DESC 
	LIMIT 1;
END //
DELIMITER ;

-- Procedure Update Topic
DELIMITER //
DROP PROCEDURE IF EXISTS update_topic //
CREATE PROCEDURE update_topic(
    IN p_topicID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20),
    IN p_title VARCHAR(255),
    IN p_content TEXT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_is_owner INT DEFAULT 0;

    SELECT 1, (userID = UUID_TO_BIN(p_userID, 1))
    INTO v_exists, v_is_owner
    FROM topics 
    WHERE id = UUID_TO_BIN(p_topicID, 1) AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSEIF v_is_owner = 0 AND p_role != 'Administrator' THEN
        SELECT 'FORBIDDEN' AS `status`;
    ELSE
        UPDATE topics 
        SET title = p_title, 
            content = p_content
        WHERE id = UUID_TO_BIN(p_topicID, 1);

        SELECT 'SUCCESS' AS `status`;
    END IF;
END //
DELIMITER ;

-- Procedure Soft Delete Topic
DELIMITER //
DROP PROCEDURE IF EXISTS soft_delete_topic //
CREATE PROCEDURE soft_delete_topic(
    IN p_topicID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM topics 
    WHERE id = UUID_TO_BIN(p_topicID, 1) AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    
    ELSE
        UPDATE topics 
        SET isDeleted = 1
        WHERE id = UUID_TO_BIN(p_topicID, 1) 
		AND (userID = UUID_TO_BIN(p_userID, 1) OR p_role = 'Administrator');

        IF ROW_COUNT() > 0 THEN
            SELECT 'SUCCESS' AS `status`;
        ELSE
            SELECT 'FORBIDDEN' AS `status`;
        END IF;
    END IF;
END //
DELIMITER ;

DELIMITER //
DROP PROCEDURE IF EXISTS get_topic_comments //
CREATE PROCEDURE get_topic_comments(
    IN p_topicID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
	SELECT commentCount AS total
    FROM topics
    WHERE id = UUID_TO_BIN(p_topicID, 1);

    SELECT 
        v.*,
        (SELECT `type` FROM likes 
         WHERE commentID = UUID_TO_BIN(v.id, 1) 
		 AND userID = UUID_TO_BIN(p_currentUserID, 1)
        ) AS userReaction
    FROM get_comments v
    WHERE v.topicID = p_topicID
    ORDER BY v.createdAt ASC
    LIMIT p_limit OFFSET p_offset;
END //
DELIMITER ;

-- Procedure Create Comment
DELIMITER //
DROP PROCEDURE IF EXISTS create_comment//
CREATE PROCEDURE create_comment(
    IN p_body TEXT,
    IN p_topicID VARCHAR(36),
    IN p_userID VARCHAR(36)
)
BEGIN
	DECLARE v_topic_exists INT DEFAULT 0;
    
    SELECT 1 INTO v_topic_exists
    FROM topics
    WHERE id = UUID_TO_BIN(p_topicID, 1) AND isDeleted = 0
    LIMIT 1;

    IF v_topic_exists = 1 THEN
		INSERT INTO comments (body, topicID, userID) 
		VALUES (
			p_body, 
			UUID_TO_BIN(p_topicID, 1),
			UUID_TO_BIN(p_userID, 1)
		);

		SELECT BIN_TO_UUID(id, 1) AS id 
		FROM comments
		WHERE userID = UUID_TO_BIN(p_userID, 1) 
		ORDER BY createdAt DESC 
		LIMIT 1;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This topic does not exist.';
    END IF;
END //
DELIMITER ;

-- Procedure Update Comment
DELIMITER //
DROP PROCEDURE IF EXISTS update_comment //
CREATE PROCEDURE update_comment(
    IN p_commentID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20),
    IN p_body TEXT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_is_owner INT DEFAULT 0;

    SELECT 1, (userID = UUID_TO_BIN(p_userID, 1))
    INTO v_exists, v_is_owner
    FROM comments 
    WHERE id = UUID_TO_BIN(p_commentID, 1) AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSEIF v_is_owner = 0 AND p_role != 'Administrator' THEN
        SELECT 'FORBIDDEN' AS `status`;
    ELSE
        UPDATE comments
        SET body = p_body
        WHERE id = UUID_TO_BIN(p_commentID, 1);

        SELECT 'SUCCESS' AS `status`;
    END IF;
END //
DELIMITER ;

-- Procedure Soft Delete Comment
DELIMITER //
DROP PROCEDURE IF EXISTS soft_delete_comment //
CREATE PROCEDURE soft_delete_comment(
    IN p_commentID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM comments
    WHERE id = UUID_TO_BIN(p_commentID, 1) AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    
    ELSE
        UPDATE comments
        SET isDeleted = 1
        WHERE id = UUID_TO_BIN(p_commentID, 1) 
		AND (userID = UUID_TO_BIN(p_userID, 1) OR p_role = 'Administrator');

        IF ROW_COUNT() > 0 THEN
            SELECT 'SUCCESS' AS `status`;
        ELSE
            SELECT 'FORBIDDEN' AS `status`;
        END IF;
    END IF;
END //
DELIMITER ;

DELIMITER //
DROP PROCEDURE IF EXISTS toggle_reaction //
CREATE PROCEDURE toggle_reaction(
    IN p_userID VARCHAR(36),
    IN p_commentID VARCHAR(36),
    IN p_type ENUM('like', 'dislike')
)
BEGIN
    DECLARE v_existing_type ENUM('like', 'dislike') DEFAULT NULL;

    SELECT `type` INTO v_existing_type
    FROM likes
    WHERE userID = UUID_TO_BIN(p_userID, 1) 
	AND commentID = UUID_TO_BIN(p_commentID, 1);

    IF v_existing_type IS NULL THEN
        INSERT INTO likes (userID, commentID, `type`)
        VALUES (UUID_TO_BIN(p_userID, 1), UUID_TO_BIN(p_commentID, 1), p_type);
        
        SELECT 'CREATED' AS `status`;
    ELSEIF v_existing_type = p_type THEN
        DELETE FROM likes 
        WHERE userID = UUID_TO_BIN(p_userID, 1) 
		AND commentID = UUID_TO_BIN(p_commentID, 1);
        
        SELECT 'REMOVED' AS `status`;
    ELSE
        UPDATE likes 
        SET `type` = p_type
        WHERE userID = UUID_TO_BIN(p_userID, 1) 
		AND commentID = UUID_TO_BIN(p_commentID, 1);
        
        SELECT 'UPDATED' AS `status`;
    END IF;
END //
DELIMITER ;

-- -- EVENTS
-- SET GLOBAL event_scheduler = ON;
-- 
-- -- Event Daily Hard Delete Cleanup
-- DELIMITER //
-- DROP EVENT IF EXISTS daily_hard_delete_cleanup//
-- CREATE EVENT daily_hard_delete_cleanup
-- ON SCHEDULE EVERY 1 DAY
-- STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 3 HOUR) -- Corre às 3 da manhã
-- DO
-- BEGIN
--     DELETE FROM users 
--     WHERE isDeleted = 1 
--     AND deletedAt < NOW() - INTERVAL 30 DAY;
-- 
--     DELETE FROM topics 
--     WHERE isDeleted = 1 
--     AND deletedAt < NOW() - INTERVAL 30 DAY;
-- 
--     DELETE FROM comments 
--     WHERE isDeleted = 1 
--     AND deletedAt < NOW() - INTERVAL 30 DAY;
-- END //
-- DELIMITER ;
