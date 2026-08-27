DROP DATABASE IF EXISTS `webhook`;
CREATE DATABASE IF NOT EXISTS `webhook`;
USE `webhook`;

DROP TABLE IF EXISTS `card_hook`;
CREATE TABLE IF NOT EXISTS `card_hook` (
  `tran_dt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `datajs` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELETE FROM `card_hook`;

DROP TABLE IF EXISTS `card_reco`;
CREATE TABLE IF NOT EXISTS `card_reco` (
  `reco_id` int(11) NOT NULL AUTO_INCREMENT,
  `mesin_sn` char(20) DEFAULT '',
  `tran_id` bigint(20) NOT NULL DEFAULT '0',
  `user_id` char(20) DEFAULT '',
  `disp_nm` char(50) DEFAULT '',
  `tran_dt` datetime DEFAULT NULL,
  `stateid` smallint(6) DEFAULT '0',
  `verify` smallint(6) DEFAULT '0',
  `workcod` varchar(50) DEFAULT '',
  `is_mask` smallint(6) NOT NULL DEFAULT '0',
  `bodytem` decimal(7,2) DEFAULT '0.00',
  PRIMARY KEY (`reco_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELETE FROM `card_reco`;

