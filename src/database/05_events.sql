-- EVENTS
SET GLOBAL event_scheduler = ON;

-- Event Daily Hard Delete Cleanup
DELIMITER //
DROP EVENT IF EXISTS daily_hard_delete_cleanup//
CREATE EVENT daily_hard_delete_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 3 HOUR)
DO
BEGIN
    DELETE FROM users 
    WHERE isDeleted = 1 
    AND deletedAt < NOW() - INTERVAL 30 DAY;

    DELETE FROM topics 
    WHERE isDeleted = 1 
    AND deletedAt < NOW() - INTERVAL 30 DAY;

    DELETE FROM comments 
    WHERE isDeleted = 1 
    AND deletedAt < NOW() - INTERVAL 30 DAY;
END //
DELIMITER ;
