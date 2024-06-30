CREATE DATABASE angular_bd;

USE angular_bd;

CREATE TABLE users (
  id int NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  image longblob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

CREATE TABLE datos (
  id int NOT NULL AUTO_INCREMENT,
  total int NOT NULL,
  categoria varchar(255) NOT NULL,
  fecha DATE NOT NULL,
  PRIMARY KEY (`id`)
);