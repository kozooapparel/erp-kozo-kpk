-- ===========================================
-- UPDATE: Harga Jual Master Barang (harga supplier -> markup margin 30%)
-- Harga jual = harga_supplier / 0.70, dibulatkan ke nominal rapi (kelipatan 5.000).
-- Harga supplier tidak disimpan di DB (dicatat manual oleh user).
-- ===========================================

-- CELANA
UPDATE public.barang
SET harga_satuan = 70000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN ANTI UV' AND harga_satuan = 50000;

UPDATE public.barang
SET harga_satuan = 55000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN EXCLUSIVE' AND harga_satuan = 40000
  AND kategori = 'LOTTO EMBOSH DROPNEDLE PUMA SMASH';

UPDATE public.barang
SET harga_satuan = 80000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN EXCLUSIVE' AND harga_satuan = 55000
  AND kategori = 'LOTTO EMBOSH DROPNEDLE PUMA SMASH';

UPDATE public.barang
SET harga_satuan = 115000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN LOTTO' AND harga_satuan = 80000;

UPDATE public.barang
SET harga_satuan = 55000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN PREMIUM' AND harga_satuan = 40000
  AND kategori = 'MILANO BRAZIL WAFEL BENZEMA';

UPDATE public.barang
SET harga_satuan = 135000
WHERE nama_barang = 'CELANA FULLPRINT BAHAN SCUBA' AND harga_satuan = 95000;

UPDATE public.barang
SET harga_satuan = 40000
WHERE nama_barang = 'CELANA NONPRINT BAHAN PREMIUM' AND harga_satuan = 30000
  AND kategori = 'MILANO BRAZIL WAFEL BENZEMA';

UPDATE public.barang
SET harga_satuan = 70000
WHERE nama_barang = 'CELANA PANJANG NON PRINT BAHAN LOTTO' AND harga_satuan = 50000;

-- DTF / LOGO
UPDATE public.barang
SET harga_satuan = 3000
WHERE nama_barang = 'DTF LOGO/SIZE LABEL' AND harga_satuan = 2000;

-- HOODIE
UPDATE public.barang
SET harga_satuan = 230000
WHERE nama_barang = 'HOODIE GRADE A- COTTON' AND harga_satuan = 160000;

UPDATE public.barang
SET harga_satuan = 120000
WHERE nama_barang = 'HOODIE GRADE B - PE' AND harga_satuan = 85000;

UPDATE public.barang
SET harga_satuan = 170000
WHERE nama_barang = 'HOODIE GRADE B - PE SOFT TEBAL' AND harga_satuan = 120000;

-- JAKET
UPDATE public.barang
SET harga_satuan = 220000
WHERE nama_barang = 'JAKET FULLPRINT LOTTO (KUPLUK)' AND harga_satuan = 155000;

UPDATE public.barang
SET harga_satuan = 195000
WHERE nama_barang = 'JAKET FULLPRINT LOTTO (TANPA KUPLUK)' AND harga_satuan = 135000;

-- JERSEY
UPDATE public.barang
SET harga_satuan = 145000
WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL ANTI UV' AND harga_satuan = 100000
  AND kategori = 'MILANO UV, BRAZIL DAN WAFEL';

UPDATE public.barang
SET harga_satuan = 130000
WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL BAHAN BASIC' AND harga_satuan = 90000
  AND kategori = 'JERSEY BASIC';

UPDATE public.barang
SET harga_satuan = 155000
WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL DRYCOOL' AND harga_satuan = 110000
  AND kategori = 'MICROCOOL';

UPDATE public.barang
SET harga_satuan = 145000
WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL EXCLUSIVE' AND harga_satuan = 100000
  AND kategori = 'EMBOSH DROPNEDLE PUMA SMASH';

UPDATE public.barang
SET harga_satuan = 130000
WHERE nama_barang = 'JERSEY FULLPRINT ATASAN SIZE NORMAL PREMIUM' AND harga_satuan = 90000
  AND kategori = 'JERSEY';

-- AKSESORIS (KERAH, LOGO, POLA, DLL)
UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'KERAH KANCING' AND harga_satuan = 13000;

UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'KERAH V ADIDAS PALANG' AND harga_satuan = 10000;

UPDATE public.barang
SET harga_satuan = 13000
WHERE nama_barang = 'KERAH V PALANG' AND harga_satuan = 9000;

UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'KUPLUK/TUDUNG' AND harga_satuan = 15000;

UPDATE public.barang
SET harga_satuan = 50000
WHERE nama_barang = 'LOGO 3D' AND harga_satuan = 35000;

UPDATE public.barang
SET harga_satuan = 4000
WHERE nama_barang = 'LOGO AUTHENTIC/DTF' AND harga_satuan = 2500;

UPDATE public.barang
SET harga_satuan = 7000
WHERE nama_barang = 'PECAH POLA BELAKANG' AND harga_satuan = 5000;

UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'PECAH POLA DEPAN - BELAKANG' AND harga_satuan = 10000;

-- POLO
UPDATE public.barang
SET harga_satuan = 85000
WHERE nama_barang = 'POLO T - SHIRT GRADE A' AND harga_satuan = 61000;

UPDATE public.barang
SET harga_satuan = 75000
WHERE nama_barang = 'POLO T-SHIRT GRADE B' AND harga_satuan = 51000;

-- RIB
UPDATE public.barang
SET harga_satuan = 6000
WHERE nama_barang = 'RIB O NECK' AND harga_satuan = 4000;

UPDATE public.barang
SET harga_satuan = 6000
WHERE nama_barang = 'RIB TANGAN PANJANG' AND harga_satuan = 4000;

-- SAKU
UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'SAKU CELANA (SATU)' AND harga_satuan = 10000;

UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'SAKU CELANA KANAN-KIRI' AND harga_satuan = 15000;

UPDATE public.barang
SET harga_satuan = 7000
WHERE nama_barang = 'SAKU DADA DEPAN' AND harga_satuan = 5000;

-- SAMBUNG / SLETING
UPDATE public.barang
SET harga_satuan = 7000
WHERE nama_barang = 'SAMBUNG STIK LENGAN RIB' AND harga_satuan = 5000;

UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'SLETING DADA ATAS' AND harga_satuan = 13000;

UPDATE public.barang
SET harga_satuan = 30000
WHERE nama_barang = 'SLETING FULL' AND harga_satuan = 20000;

-- T-SHIRT
UPDATE public.barang
SET harga_satuan = 70000
WHERE nama_barang = 'T-SHIRT GRADE A' AND harga_satuan = 50000;

UPDATE public.barang
SET harga_satuan = 65000
WHERE nama_barang = 'T-SHIRT GRADE B' AND harga_satuan = 45000;

UPDATE public.barang
SET harga_satuan = 50000
WHERE nama_barang = 'T-SHIRT GRADE C' AND harga_satuan = 35000;

-- TAMBAHAN ATASAN
UPDATE public.barang
SET harga_satuan = 7000
WHERE nama_barang = 'TAMBAHAN ATASAN 2XL' AND harga_satuan = 5000;

UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'TAMBAHAN ATASAN 3XL' AND harga_satuan = 10000;

UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'TAMBAHAN ATASAN 4XL' AND harga_satuan = 15000;

UPDATE public.barang
SET harga_satuan = 35000
WHERE nama_barang = 'TAMBAHAN ATASAN 5XL' AND harga_satuan = 25000;

UPDATE public.barang
SET harga_satuan = 50000
WHERE nama_barang = 'TAMBAHAN ATASAN 6XL' AND harga_satuan = 35000;

-- TAMBAHAN BADAN/OVAL
UPDATE public.barang
SET harga_satuan = 6000
WHERE nama_barang = 'TAMBAHAN BADAN BELAKANG OVAL' AND harga_satuan = 4000;

UPDATE public.barang
SET harga_satuan = 10000
WHERE nama_barang = 'TAMBAHAN DEPAN BELAKANG OVAL' AND harga_satuan = 7000;

-- TAMBAHAN LENGAN/REGLAN
UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'TAMBAHAN LENGAN PANJANG' AND harga_satuan = 15000;

UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'TAMBAHAN REGLAN' AND harga_satuan = 10000;

UPDATE public.barang
SET harga_satuan = 3000
WHERE nama_barang = 'TAMBAHAN SAMBUNG STIK LENGAN' AND harga_satuan = 2000;

-- TAMBAHAN STELAN
UPDATE public.barang
SET harga_satuan = 15000
WHERE nama_barang = 'TAMBAHAN STELAN 2XL' AND harga_satuan = 10000;

UPDATE public.barang
SET harga_satuan = 20000
WHERE nama_barang = 'TAMBAHAN STELAN 3XL' AND harga_satuan = 15000;

UPDATE public.barang
SET harga_satuan = 35000
WHERE nama_barang = 'TAMBAHAN STELAN 4XL' AND harga_satuan = 25000;

UPDATE public.barang
SET harga_satuan = 50000
WHERE nama_barang = 'TAMBAHAN STELAN 5XL' AND harga_satuan = 35000;

UPDATE public.barang
SET harga_satuan = 65000
WHERE nama_barang = 'TAMBAHAN STELAN 6XL' AND harga_satuan = 45000;

-- V
UPDATE public.barang
SET harga_satuan = 13000
WHERE nama_barang = 'V ADIDAS KERAH' AND harga_satuan = 9000;

UPDATE public.barang
SET harga_satuan = 7000
WHERE nama_barang = 'V ADIDAS PALANG' AND harga_satuan = 5000;

UPDATE public.barang
SET harga_satuan = 17000
WHERE nama_barang = 'V SANGHAI KANCING' AND harga_satuan = 12000;

-- ZIPLOCK
UPDATE public.barang
SET harga_satuan = 1000
WHERE nama_barang = 'ZIPLOCK' AND harga_satuan = 700;