-- name: selectUserInfo
SELECT 
    user_id, 
    user_name
FROM user
WHERE user_id = ? 
    AND user_password = ?;

-- name: insertUserInfo
INSERT INTO 
    user (
        user_id, 
        user_name, 
        user_password
        )
VALUES
    (?, ?, ?);

-- name: insertNewAccount
INSERT INTO 
    account (
        account_address, 
        user_id, 
        account_cash
        ) 
VALUES
    (?, ?, 100000000);

-- name: selectAccountCash
SELECT 
    account_cash
FROM account
WHERE user_id = ?;

-- name: insertNewTrade
INSERT INTO 
    trade_coin (
        trade_info, 
        user_id, 
        coin_name, 
        coin_leverage,
        coin_ea,
        order_price, 
        sum_order, 
        type_option, 
        done
        ) 
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: selectMyCoinList
SELECT 
    coin_name, 
    SUM(coin_ea) AS coin_ea, 
    AVG(coin_leverage) AS coin_leverage, 
    FLOOR(AVG(order_price)) AS avg_order_price, 
    SUM(sum_order) AS sum_order
FROM trade_coin 
WHERE user_id = ? 
    AND type_option = 'buy' 
        AND done = 0
GROUP BY coin_name
ORDER BY sum_order DESC;

-- name: updateSetCash
UPDATE account 
SET account_cash = ? 
WHERE user_id = ?;

-- name: updateSetTradeDone
UPDATE trade_coin 
SET done = 1 
WHERE user_id = ? 
    AND coin_name = ?;

-- name: selectSumCashCoinEa
SELECT 
    a.account_cash, 
    SUM(tc.coin_ea) AS coin_ea
FROM account a
    LEFT JOIN trade_coin tc 
        ON a.user_id = tc.user_id
WHERE a.user_id = ? 
    AND tc.coin_name = ? 
        AND tc.done = 0;

-- name: selectUserTransactions
SELECT 
    DATE_FORMAT(trade_sysdate, '%Y.%m.%d %H:%i') AS trade_date, 
    coin_name, 
    type_option, 
    coin_ea, 
    order_price, 
    sum_order
FROM trade_coin
WHERE user_id = ?
ORDER BY trade_sysdate DESC
LIMIT 20;

-- name: selectSumAsset
SELECT 
    a.account_cash, SUM(tc.sum_order) AS sum_order
FROM account a
    LEFT JOIN trade_coin tc 
        ON a.user_id = tc.user_id
WHERE a.user_id = ? 
    AND tc.done = 0;

-- name: selectUserRank
SELECT 
    rank, user_name, total_cash
FROM (
    SELECT 
        @rank := @rank + 1 AS rank,
        user_name, 
        total_cash
    FROM (
        SELECT 
            u.user_name, 
            a.account_cash + COALESCE(SUM(tc.sum_order), 0) AS total_cash
        FROM account a
            LEFT OUTER JOIN trade_coin tc 
                ON a.user_id = tc.user_id 
                    AND tc.done = 0
            LEFT OUTER JOIN user u 
                ON a.user_id = u.user_id
        GROUP BY a.user_id, u.user_name, a.account_cash
        ORDER BY total_cash DESC
    ) AS ranked_data,
    (SELECT @rank := 0) AS init
) AS ranked
WHERE rank <= 10;

-- name: selectCheckUserId
SELECT 
    user_id 
FROM user 
WHERE user_id = ?;
