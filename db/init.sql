CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;
CREATE TABLE products (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), price INT);
INSERT INTO products (name, price) VALUES ('apple',10),('banana',5),('secret_flag','9999');
CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50), password VARCHAR(100));
INSERT INTO users (username, password) VALUES ('admin','adminpass');
