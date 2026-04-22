-- DATABASE
DROP DATABASE IF EXISTS drifthub;
CREATE DATABASE drifthub;

-- USE
USE drifthub;

-- TABLES
-- Table Users
DROP TABLE IF EXISTS users;
CREATE TABLE users(
	id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('User', 'Administrator') DEFAULT 'User',
    birthDate DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isDeleted TINYINT DEFAULT 0,
    deletedAt TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT chk_email CHECK (email REGEXP('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'))
);

-- Table User Profiles
DROP TABLE IF EXISTS user_profiles;
CREATE TABLE user_profiles (
    userID BINARY(16) PRIMARY KEY,
    bio TEXT DEFAULT (''),
    profileImage LONGTEXT,
    showEmail TINYINT(1) DEFAULT 0,
    showBirthDate TINYINT(1) DEFAULT 0,
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
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
