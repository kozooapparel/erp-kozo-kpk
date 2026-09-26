-- ===========================================
-- UPDATE: Harga Jual +20% (harga supplier x 1.20), tanpa pembulatan
-- Nilai dihitung dari harga supplier asli di seed_barang_master.sql
-- ===========================================

-- CELANA
UPDATE public.barang SET harga_satuan = 60000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN ANTI UV';
UPDATE public.barang SET harga_satuan = 48000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN EXCLUSIVE' AND harga_satuan = 55000;
UPDATE public.barang SET harga_satuan = 66000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN EXCLUSIVE' AND harga_satuan = 80000;
UPDATE public.barang SET harga_satuan = 96000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN LOTTO';
UPDATE public.barang SET harga_satuan = 48000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN PREMIUM';
UPDATE public.barang SET harga_satuan = 114000 WHERE nama_barang = 'CELANA FULLPRINT BAHAN SCUBA';
UPDATE public.barang SET harga_satuan = 36000 WHERE nama_barang = 'CELANA NONPRINT BAHAN PREMIUM';
UPDATE public.barang SET harga_satuan = 60000 WHERE nama_barang = 'CELANA PANJANG NON PRINT BAHAN LOTTO';

-- DTF / HOODIE / JAKET
UPDATE public.barang SET harga_satuan = 2400 WHERE nama_barang = 'DTF LOGO/SIZE LABEL';
UPDATE public.barang SET harga_satuan = 192000 WHERE nama_barang = 'HOODIE GRADE A- COTTON';
UPDATE public.barang SET harga_satuan = 102000 WHERE nama_barang = 'HOODIE GRADE B - PE';
UPDATE public.barang SET harga_satuan = 144000 WHERE nama_barang = 'HOODIE GRADE B - PE SOFT TEBAL';
UPDATE public.barang SET harga_satuan = 186000 WHERE nama_barang = 'JAKET FULLPRINT LOTTO (KUPLUK)';
UPDATE public.barang SET harga_satuan = 162000 WHERE nama_barang = 'JAKET FULLPRINT LOTTO (TANPA KUPLUK)';

-- JERSEY
UPDATE public.barang SET harga_satuan = 120000 WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL ANTI UV';
UPDATE public.barang SET harga_satuan = 108000 WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL BAHAN BASIC';
UPDATE public.barang SET harga_satuan = 132000 WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL DRYCOOL';
UPDATE public.barang SET harga_satuan = 120000 WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL EXCLUSIVE';
UPDATE public.barang SET harga_satuan = 108000 WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL PREMIUM';

-- KERAH / LOGO / POLA
UPDATE public.barang SET harga_satuan = 15600 WHERE nama_barang = 'KERAH KANCING';
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'KERAH V ADIDAS PALANG';
UPDATE public.barang SET harga_satuan = 10800 WHERE nama_barang = 'KERAH V PALANG';
UPDATE public.barang SET harga_satuan = 18000 WHERE nama_barang = 'KUPLUK/TUDUNG';
UPDATE public.barang SET harga_satuan = 42000 WHERE nama_barang = 'LOGO 3D';
UPDATE public.barang SET harga_satuan = 3000 WHERE nama_barang = 'LOGO AUTHENTIC/DTF';
UPDATE public.barang SET harga_satuan = 6000 WHERE nama_barang = 'PECAH POLA BELAKANG';
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'PECAH POLA DEPAN - BELAKANG';

-- POLO
UPDATE public.barang SET harga_satuan = 73200 WHERE nama_barang = 'POLO T - SHIRT GRADE A';
UPDATE public.barang SET harga_satuan = 61200 WHERE nama_barang = 'POLO T-SHIRT GRADE B';

-- RIB
UPDATE public.barang SET harga_satuan = 4800 WHERE nama_barang = 'RIB O NECK';
UPDATE public.barang SET harga_satuan = 4800 WHERE nama_barang = 'RIB TANGAN PANJANG';

-- SAKU / SAMBUNG / SLETING
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'SAKU CELANA (SATU)';
UPDATE public.barang SET harga_satuan = 18000 WHERE nama_barang = 'SAKU CELANA KANAN-KIRI';
UPDATE public.barang SET harga_satuan = 6000 WHERE nama_barang = 'SAKU DADA DEPAN';
UPDATE public.barang SET harga_satuan = 6000 WHERE nama_barang = 'SAMBUNG STIK LENGAN RIB';
UPDATE public.barang SET harga_satuan = 15600 WHERE nama_barang = 'SLETING DADA ATAS';
UPDATE public.barang SET harga_satuan = 24000 WHERE nama_barang = 'SLETING FULL';

-- T-SHIRT
UPDATE public.barang SET harga_satuan = 60000 WHERE nama_barang = 'T-SHIRT GRADE A';
UPDATE public.barang SET harga_satuan = 54000 WHERE nama_barang = 'T-SHIRT GRADE B';
UPDATE public.barang SET harga_satuan = 42000 WHERE nama_barang = 'T-SHIRT GRADE C';

-- TAMBAHAN ATASAN
UPDATE public.barang SET harga_satuan = 6000 WHERE nama_barang = 'TAMBAHAN ATASAN 2XL';
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'TAMBAHAN ATASAN 3XL';
UPDATE public.barang SET harga_satuan = 18000 WHERE nama_barang = 'TAMBAHAN ATASAN 4XL';
UPDATE public.barang SET harga_satuan = 30000 WHERE nama_barang = 'TAMBAHAN ATASAN 5XL';
UPDATE public.barang SET harga_satuan = 42000 WHERE nama_barang = 'TAMBAHAN ATASAN 6XL';

-- TAMBAHAN BADAN/OVAL
UPDATE public.barang SET harga_satuan = 4800 WHERE nama_barang = 'TAMBAHAN BADAN BELAKANG OVAL';
UPDATE public.barang SET harga_satuan = 8400 WHERE nama_barang = 'TAMBAHAN DEPAN BELAKANG OVAL';

-- TAMBAHAN LENGAN/REGLAN
UPDATE public.barang SET harga_satuan = 18000 WHERE nama_barang = 'TAMBAHAN LENGAN PANJANG';
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'TAMBAHAN REGLAN';
UPDATE public.barang SET harga_satuan = 2400 WHERE nama_barang = 'TAMBAHAN SAMBUNG STIK LENGAN';

-- TAMBAHAN STELAN
UPDATE public.barang SET harga_satuan = 12000 WHERE nama_barang = 'TAMBAHAN STELAN 2XL';
UPDATE public.barang SET harga_satuan = 18000 WHERE nama_barang = 'TAMBAHAN STELAN 3XL';
UPDATE public.barang SET harga_satuan = 30000 WHERE nama_barang = 'TAMBAHAN STELAN 4XL';
UPDATE public.barang SET harga_satuan = 42000 WHERE nama_barang = 'TAMBAHAN STELAN 5XL';
UPDATE public.barang SET harga_satuan = 54000 WHERE nama_barang = 'TAMBAHAN STELAN 6XL';

-- V
UPDATE public.barang SET harga_satuan = 10800 WHERE nama_barang = 'V ADIDAS KERAH';
UPDATE public.barang SET harga_satuan = 6000 WHERE nama_barang = 'V ADIDAS PALANG';
UPDATE public.barang SET harga_satuan = 14400 WHERE nama_barang = 'V SANGHAI KANCING';

-- ZIPLOCK
UPDATE public.barang SET harga_satuan = 840 WHERE nama_barang = 'ZIPLOCK';