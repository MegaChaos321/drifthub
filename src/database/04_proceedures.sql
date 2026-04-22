-- USE
USE drifthub;

-- PROCEDURES
-- Procedure Create User
DELIMITER //
DROP PROCEDURE IF EXISTS create_user//
CREATE PROCEDURE create_user(
    IN p_username VARCHAR(50),
    IN p_birth_date DATE,
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255)
)
BEGIN
	DECLARE v_userID BINARY(16);
    DECLARE v_isDeleted TINYINT(1);
    SELECT id, isDeleted INTO v_userID, v_isDeleted FROM users
    WHERE email = p_email LIMIT 1;
    
    IF v_isDeleted IS NULL THEN
        INSERT INTO users (username, email, `password`, birthDate)
        VALUES (p_username, p_email, p_password_hash, p_birth_date);
        
        SELECT BIN_TO_UUID(id, 1) AS id FROM users WHERE email = p_email;
    ELSEIF v_isDeleted = 1 THEN
        UPDATE users 
        SET isDeleted = 0,
            username = p_username,
            `password` = p_password_hash,
            birthDate = p_birth_date
        WHERE email = p_email;
        
        SELECT BIN_TO_UUID(v_userId, 1) AS id;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This email is already registered and active.';
    END IF;
END //
DELIMITER ;

-- Procedure Update User
DELIMITER //
DROP PROCEDURE IF EXISTS update_user//
CREATE PROCEDURE update_user(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_role VARCHAR(20),
    IN p_username VARCHAR(50),
    IN p_birth_date DATE,
    IN p_email VARCHAR(255)
)
BEGIN
    DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM users 
    WHERE id = v_targetBin AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSEIF v_targetBin != v_currentBin AND p_role != 'Administrator' THEN
        SELECT 'FORBIDDEN' AS `status`;
    ELSE
		IF EXISTS (SELECT 1 FROM users WHERE username = p_username AND id != v_targetBin) THEN
            SELECT 'USERNAME_TAKEN' AS `status`;
        ELSEIF EXISTS (SELECT 1 FROM users WHERE email = p_email AND id != v_targetBin) THEN
            SELECT 'EMAIL_TAKEN' AS `status`;
        ELSE
			UPDATE users
			SET username = p_username,
				email = p_email,
				birthDate = p_birth_date,
				updatedAt = CURRENT_TIMESTAMP()
			WHERE id = v_targetBin;

			SELECT 'SUCCESS' AS `status`;
		END IF;
    END IF;
END //
DELIMITER ;

-- Procedure Update User Password
DELIMITER //
DROP PROCEDURE IF EXISTS update_user_password//
CREATE PROCEDURE update_user_password(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM users 
    WHERE id = v_targetBin AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSEIF v_targetBin != v_currentBin THEN
        SELECT 'FORBIDDEN' AS `status`;
    ELSE
        UPDATE users
        SET `password` = p_password_hash,
            updatedAt = CURRENT_TIMESTAMP()
        WHERE id = v_targetBin;

        SELECT 'SUCCESS' AS `status`;
    END IF;
END //
DELIMITER ;

-- Procedure Update User Profile
DELIMITER //
DROP PROCEDURE IF EXISTS update_user_profile//
CREATE PROCEDURE update_user_profile(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_role VARCHAR(20),
    IN p_bio TEXT,
    IN p_profileImage LONGTEXT,
    IN p_showEmail TINYINT(1),
    IN p_showBirthDate TINYINT(1)
)
BEGIN
    DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM users 
    WHERE id = v_targetBin AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSEIF v_targetBin != v_currentBin AND p_role != 'Administrator' THEN
        SELECT 'FORBIDDEN' AS `status`;
    ELSE
        UPDATE user_profiles 
        SET bio = p_bio,
            profileImage = p_profileImage,
            showEmail = p_showEmail,
            showBirthDate = p_showBirthDate
        WHERE userID = v_targetBin;

        SELECT 'SUCCESS' AS `status`;
    END IF;
END //
DELIMITER ;

-- Procedure Soft Delete User
DELIMITER //
DROP PROCEDURE IF EXISTS soft_delete_user //
CREATE PROCEDURE soft_delete_user(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
	DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM users 
    WHERE id = v_targetBin AND isDeleted = 0
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    ELSE
        UPDATE users
        SET isDeleted = 1
        WHERE id = v_targetBin 
		AND (v_targetBin = v_currentBin OR p_role = 'Administrator');

        IF ROW_COUNT() > 0 THEN
            SELECT 'SUCCESS' AS `status`;
        ELSE
            SELECT 'FORBIDDEN' AS `status`;
        END IF;
    END IF;
END //
DELIMITER ;

-- Procedure Get User Profile
DELIMITER //
DROP PROCEDURE IF EXISTS get_user_profile//
CREATE PROCEDURE get_user_profile(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
	DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    
    IF v_targetBin = v_currentBin OR p_role = 'Administrator' THEN
        SELECT 
            BIN_TO_UUID(u.id, 1) AS id,
            u.username,
            u.email,
            u.`role`,
            u.birthDate,
            u.createdAt,
            up.bio,
            up.profileImage,
            up.showEmail,
            up.showBirthDate
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.userID
        WHERE u.id = v_targetBin
        AND u.isDeleted = 0;
    ELSE
        SELECT * FROM get_public_profiles 
        WHERE id = p_targetUserID;
    END IF;
END //
DELIMITER ;

-- Procedure Get User Activity
DELIMITER //
DROP PROCEDURE IF EXISTS get_user_activity //
CREATE PROCEDURE get_user_activity(
    IN p_targetUserID VARCHAR(36),
    IN p_currentUserID VARCHAR(36),
    IN p_role VARCHAR(20),
    IN p_viewMode TINYINT
)
BEGIN
	DECLARE v_targetBin BINARY(16) DEFAULT UUID_TO_BIN(p_targetUserID, 1);
    DECLARE v_currentBin BINARY(16) DEFAULT UUID_TO_BIN(p_currentUserID, 1);
    
    IF p_viewMode = 0 THEN
        SELECT * FROM get_topics 
        WHERE userID = p_targetUserID
        ORDER BY createdAt DESC;
    ELSEIF p_viewMode = 1 THEN
        IF v_targetBin = v_currentBin OR p_role = 'Administrator' THEN
            SELECT * FROM get_deleted_topics 
            WHERE userID = p_targetUserID
            ORDER BY deletedAt DESC;
        ELSE
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Access to deleted topics denied.';
        END IF;
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

-- Procedure Restore Topic
DELIMITER //
DROP PROCEDURE IF EXISTS restore_topic //
CREATE PROCEDURE restore_topic(
    IN p_topicID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM topics 
    WHERE id = UUID_TO_BIN(p_topicID, 1) AND isDeleted = 1
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    
    ELSE
        UPDATE topics 
        SET isDeleted = 0
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

-- Procedure Hard Delete Topic
DELIMITER //
DROP PROCEDURE IF EXISTS hard_delete_topic //
CREATE PROCEDURE hard_delete_topic(
    IN p_topicID VARCHAR(36),
    IN p_userID VARCHAR(36),
    IN p_role VARCHAR(20)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT 1 INTO v_exists
    FROM topics 
    WHERE id = UUID_TO_BIN(p_topicID, 1) AND isDeleted = 1
    LIMIT 1;

    IF v_exists = 0 THEN
        SELECT 'NOT_FOUND' AS `status`;
    
    ELSE
        DELETE FROM topics
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
