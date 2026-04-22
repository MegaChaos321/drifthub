-- USE
USE drifthub;

-- TRIGGERS
-- Trigger Before User Insert
DELIMITER //
DROP TRIGGER IF EXISTS before_user_insert//
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.birthDate > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Date of birth cannot be a future date.';
    END IF;
END //
DELIMITER ;

-- Trigger After User Insert
DELIMITER //
DROP TRIGGER IF EXISTS after_user_insert//
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_profiles (userID)
    VALUES (NEW.id);
END //
DELIMITER ;

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
    
    IF NEW.birthDate > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Birthdate cannot come from the future.';
    END IF;
END //
DELIMITER ;

-- Trigger After User Profile Update
DELIMITER //
DROP TRIGGER IF EXISTS after_user_profile_update//
CREATE TRIGGER after_user_profile_update
AFTER UPDATE ON user_profiles
FOR EACH ROW
BEGIN
    UPDATE users
    SET updatedAt = CURRENT_TIMESTAMP()
    WHERE id = NEW.userID;
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
    
    IF (NEW.title <> OLD.title OR NEW.content <> OLD.content) THEN
        SET NEW.updatedAt = NOW();
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
	IF OLD.isDeleted = 0 THEN
		UPDATE topics 
		SET commentCount = commentCount - 1
		WHERE id = OLD.topicID;
    END IF;
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
    IF OLD.`type` = 'like' AND NEW.`type` = 'dislike' THEN
        UPDATE comments 
        SET likeCount = likeCount - 1, 
            dislikeCount = dislikeCount + 1 
        WHERE id = NEW.commentID;
        
    ELSEIF OLD.`type` = 'dislike' AND NEW.`type` = 'like' THEN
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
    IF OLD.`type` = 'like' THEN
        UPDATE comments SET likeCount = likeCount - 1 WHERE id = OLD.commentID;
    ELSE
        UPDATE comments SET dislikeCount = dislikeCount - 1 WHERE id = OLD.commentID;
    END IF;
END //
DELIMITER ;
