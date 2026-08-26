# Product Requirements Document (PRD)

## Aplikasi Traceability Part & Cycle Timer — TCF N-Series

**Versi:** 1.2
**Tanggal:** 26 Agustus 2026
**Status:** Updated Draft
**Platform:** Web Application
**Teknologi:** HTML, JavaScript, Node.js/Express, MySQL

---

# 1. Ringkasan Produk

Aplikasi **Traceability Part & Cycle Timer (TCF N-Series)** adalah aplikasi web untuk mencatat, menelusuri, dan memonitor proses produksi unit TCF N-Series secara digital.

Aplikasi mencakup:

* Traceability unit berdasarkan NIK/barcode.
* Traceability part/komponen penting.
* Pencatatan No Engine.
* Pairing No Engine dengan NIK pada Stage 13.
* Konfigurasi varian unit.
* Checklist inspeksi berdasarkan varian dan pos.
* Pencatatan defect dengan status OPEN/CLOSED.
* Monitoring Cycle Time dan Delay Time.
* Indikator Takt Time.
* Perhitungan **DPU (Defect per Unit)**.
* Perhitungan **DRR (Direct Run Ratio)**.
* Monitoring DPU dan DRR berdasarkan **hari, minggu, bulan, shift, dan group**.
* Manajemen **2 shift per hari**.
* Pengelompokan user ke **Group A dan Group B**.
* Login user menggunakan pilihan shift dan group.
* Dashboard monitoring produksi dan kualitas.
* Pencarian histori traceability berdasarkan NIK.
* Export data CSV/Excel.

---

# 2. Latar Belakang

Sistem sebelumnya berfokus pada traceability, inspeksi, cycle time, delay time, dan defect management.

Dengan kebutuhan tambahan, sistem harus dapat mengukur performa kualitas secara lebih operasional menggunakan:

1. **DPU — Defect per Unit**
2. **DRR — Direct Run Ratio**

DRR tidak hanya mengukur apakah defect telah diselesaikan dalam batas waktu. DRR harus menggambarkan apakah unit dapat **langsung melanjutkan proses tanpa membawa defect OPEN melewati pos pemeriksaan yang bersangkutan**.

Ketika sebuah defect masih berstatus **OPEN** dan unit telah melewati POS/proses yang terkait dengan defect tersebut, kondisi tersebut harus masuk ke dalam perhitungan DRR sebagai unit yang **tidak Direct Run**.

Selain itu, pengukuran KPI harus dapat dipisahkan berdasarkan:

* Tanggal.
* Minggu.
* Bulan.
* Shift.
* Group A.
* Group B.
* Workstation/Pos.
* Stage.
* Variant.

---

# 3. Tujuan Produk

## 3.1 Tujuan Utama

Membangun sistem digital yang menjadi **single source of truth** untuk:

**Traceability + Inspection + Cycle Monitoring + Defect + Quality KPI + Shift Monitoring**

## 3.2 Tujuan Khusus

Sistem harus mampu:

* Mengidentifikasi unit menggunakan NIK/barcode.
* Mengidentifikasi inspector.
* Mengidentifikasi shift.
* Mengidentifikasi group user.
* Mencatat komponen penting.
* Menghubungkan No Engine dengan NIK.
* Mengatur item checking berdasarkan varian dan pos.
* Mengukur cycle time dan delay time.
* Mencatat defect.
* Menentukan apakah unit Direct Run atau tidak.
* Menghitung DPU.
* Menghitung DRR.
* Menghasilkan KPI harian, mingguan, bulanan, dan per shift.
* Membandingkan performa Shift dan Group A/B.
* Menampilkan seluruh KPI pada dashboard.

---

# 4. Definisi Konsep Quality KPI

## 4.1 Unit Cek

**Unit Cek** adalah unit/NIK yang telah menyelesaikan proses pengecekan pada POS yang menjadi basis pengukuran.

Untuk KPI yang membutuhkan basis unit, satu NIK dihitung sebagai satu unit pada basis POS/periode yang telah ditentukan.

Sistem harus mencegah penghitungan unit ganda dalam satu basis KPI.

---

# 5. DPU — Defect per Unit

## 5.1 Definisi

DPU adalah jumlah defect yang ditemukan dibagi jumlah unit cek.

### Formula

**DPU = Total Defect / Total Unit Cek**

Contoh:

* Unit cek = 100.
* Defect = 8.

Maka:

**DPU = 8 / 100 = 0,08**

DPU menggunakan jumlah defect, sehingga satu unit dapat memberikan kontribusi lebih dari satu defect.

---

# 6. DRR — Direct Run Ratio

## 6.1 Definisi Baru

**DRR (Direct Run Ratio)** adalah persentase unit yang dapat menjalankan proses secara langsung tanpa membawa defect OPEN melewati POS cek yang berkaitan dengan defect tersebut.

Dengan kata lain:

> Apabila defect masih berstatus **OPEN** dan unit sudah melewati POS pemeriksaan yang bersangkutan, unit tersebut dinyatakan **tidak Direct Run** dan masuk sebagai unit yang mempengaruhi DRR.

---

# 7. Konsep Direct Run

Sistem harus menentukan status Direct Run setiap unit berdasarkan perjalanan unit pada proses produksi.

### Direct Run = TRUE

Apabila:

* Tidak ada defect yang menghambat/berhubungan dengan unit tersebut; atau
* Semua defect yang relevan telah selesai/closed sebelum unit melewati POS yang menjadi titik pemeriksaan berikutnya.

### Direct Run = FALSE

Apabila:

* Unit memiliki defect OPEN; dan
* Unit sudah melewati POS yang bersangkutan dengan defect tersebut.

Kondisi tersebut menunjukkan bahwa defect dibawa melewati proses/pos dan unit tidak berjalan secara direct run.

---

# 8. Formula DRR

Formula utama:

**DRR = (Jumlah Unit Cek Direct Run / Jumlah Unit Cek) × 100%**

atau secara ekuivalen:

**DRR = ((Jumlah Unit Cek - Jumlah Unit Tidak Direct Run) / Jumlah Unit Cek) × 100%**

### Contoh

Unit cek = 100.

Unit yang membawa defect OPEN melewati POS terkait = 5.

Maka:

**Unit Direct Run = 100 - 5 = 95**

**DRR = (95 / 100) × 100% = 95%**

---

# 9. Aturan Penentuan DRR

## 9.1 Defect OPEN Sebelum POS Berikutnya

Contoh:

```text
Stage 5
  ↓
Defect ditemukan
  ↓
Status = OPEN
  ↓
Stage 13
```

Jika defect tersebut masih OPEN ketika unit melewati Stage 13 dan defect memang terkait dengan proses yang harus ditindaklanjuti, maka:

**Direct Run = FALSE**

---

## 9.2 Defect CLOSED Sebelum Melewati POS Terkait

Contoh:

```text
Stage 5
  ↓
Defect ditemukan
  ↓
Repair
  ↓
Defect CLOSED
  ↓
Stage 13
```

Maka:

**Direct Run = TRUE**

---

## 9.3 Defect OPEN Tetapi Unit Belum Melewati POS Terkait

Defect tetap:

**OPEN**

tetapi unit belum dapat dikategorikan sebagai tidak Direct Run hanya berdasarkan status OPEN tersebut.

Status akan dievaluasi ketika unit melewati POS yang relevan.

---

## 9.4 Satu Unit Memiliki Banyak Defect

Apabila satu NIK memiliki beberapa defect:

* Defect 1 = CLOSED sebelum POS berikutnya.
* Defect 2 = OPEN dan unit melewati POS terkait.
* Defect 3 = CLOSED.

Maka unit tetap dihitung:

**1 Unit Tidak Direct Run**

bukan 3.

Dengan demikian DRR adalah **unit-based KPI**, bukan defect-count KPI.

---

# 10. Hubungan DPU dan DRR

DPU dan DRR memiliki tujuan yang berbeda.

### DPU

Mengukur **jumlah defect** terhadap unit.

```text
DPU = Total Defect / Unit Check
```

### DRR

Mengukur **kemampuan unit berjalan langsung tanpa membawa defect OPEN melewati POS terkait**.

```text
DRR =
Direct Run Unit / Unit Check × 100%
```

Contoh:

| Kondisi               | Nilai |
| --------------------- | ----: |
| Unit Check            |   100 |
| Total Defect          |     8 |
| Unit Tidak Direct Run |     5 |
| DPU                   |  0,08 |
| DRR                   |   95% |

Dapat terjadi:

* DPU rendah tetapi DRR rendah.
* DPU tinggi tetapi DRR tetap tinggi apabila defect ditutup sebelum unit melewati POS berikutnya.
* Satu unit memiliki banyak defect sehingga DPU bertambah lebih besar daripada dampaknya terhadap DRR.

---

# 11. Sistem Shift

## 11.1 Jumlah Shift

Dalam satu hari terdapat **2 shift**.

Nama dan jam masing-masing shift ditentukan oleh Admin melalui konfigurasi sistem.

Sistem tidak boleh meng-hardcode jam shift.

Admin dapat menentukan:

* Nama shift.
* Jam mulai.
* Jam selesai.
* Status aktif/nonaktif.
* Hari berlaku.

---

# 12. Konfigurasi Shift oleh Admin

Admin memiliki menu:

**Master Shift**

Contoh konfigurasi:

| Shift   | Nama                  |    Jam Mulai |  Jam Selesai |
| ------- | --------------------- | -----------: | -----------: |
| Shift 1 | Shift 1               | Configurable | Configurable |
| Shift 2 | Shift 2 / Shift Malam | Configurable | Configurable |

Karena jadwal aktual akan ditentukan kemudian oleh Admin, sistem harus membuat konfigurasi tersebut fleksibel.

Shift dapat melintasi tengah malam.

Contoh:

**21:00 → 06:00**

Sistem harus tetap memperlakukannya sebagai satu shift produksi.

---

# 13. Group User

Sistem menyediakan dua group:

* **Group A**
* **Group B**

Group digunakan untuk mengidentifikasi kelompok kerja dan melakukan analisis KPI.

Group menjadi atribut transaksi sehingga setiap data inspection, defect, dan KPI dapat ditelusuri kembali ke group yang menjalankan proses.

---

# 14. Login User dengan Shift dan Group

Pada saat login, user memasukkan:

* Username.
* Password.
* Shift.
* Group.

Contoh:

```text
Username : INS001
Password : ********
Shift    : Shift 1
Group    : Group A
```

Setelah login, sistem menyimpan konteks:

```text
User
+
Shift
+
Group
+
Workstation
```

Context tersebut digunakan pada seluruh transaksi selama sesi kerja.

---

# 15. Validasi Login Shift

Sistem harus memastikan:

1. Shift aktif.
2. Group aktif.
3. User aktif.
4. Shift sesuai jadwal yang tersedia.

Apabila shift tidak aktif atau tidak tersedia, user tidak dapat melakukan login menggunakan shift tersebut.

---

# 16. Pergantian Shift

User tidak boleh mengubah shift secara sembarangan ketika sedang memiliki sesi produksi aktif.

Untuk mengganti shift:

1. User melakukan **Akhiri Sesi / Selesai Shift**.
2. Session saat ini ditutup.
3. User login kembali dengan shift baru.

---

# 17. Shift pada Transaksi

Setiap transaksi utama harus menyimpan:

* User ID.
* Shift ID.
* Group ID.
* Workstation ID.
* Variant ID.
* Timestamp.

Minimal berlaku untuk:

* Unit inspection.
* Component inspection.
* Cycle record.
* Defect.
* Defect resolution.
* Direct Run evaluation.

Dengan demikian data KPI dapat dihitung berdasarkan shift secara konsisten.

---

# 18. Perhitungan KPI Berdasarkan Shift

DPU dan DRR harus tersedia berdasarkan:

### Harian

Kumulatif satu hari.

### Shift

Nilai untuk shift tertentu.

Contoh:

* 26 Agustus — Shift 1.
* 26 Agustus — Shift 2.

### Mingguan

Akumulasi beberapa hari dalam satu minggu.

### Bulanan

Akumulasi dari tanggal 1 sampai tanggal berjalan.

---

# 19. KPI Group A dan Group B

DPU dan DRR juga harus dapat difilter berdasarkan:

* Group A.
* Group B.

Contoh:

| Group | Unit Check | Defect |   DPU | Not Direct Run |   DRR |
| ----- | ---------: | -----: | ----: | -------------: | ----: |
| A     |        500 |     22 | 0,044 |              8 | 98,4% |
| B     |        500 |     30 | 0,060 |             15 | 97,0% |

Nilai di atas hanya contoh.

---

# 20. Periode Kumulatif

Sistem menyediakan pilihan:

### Daily

Kumulatif dari awal tanggal sampai akhir tanggal.

### Weekly

Kumulatif dari awal minggu sampai tanggal berjalan.

### Monthly

Kumulatif dari tanggal 1 sampai tanggal berjalan.

### Shift

Kumulatif transaksi di dalam satu shift.

### Shift + Group

Kombinasi:

```text
Tanggal + Shift + Group
```

Contoh:

**26 Agustus 2026 — Shift 2 — Group B**

---

# 21. Dashboard Quality KPI

Dashboard Admin/Quality harus memiliki section:

## QUALITY PERFORMANCE

Menampilkan:

* Unit Check.
* Total Defect.
* DPU.
* Direct Run Unit.
* Not Direct Run Unit.
* DRR.
* Open Defect.
* Closed Defect.

---

# 22. Dashboard Berdasarkan Periode

Dashboard menyediakan tab:

```text
DAILY | SHIFT | WEEKLY | MONTHLY
```

Contoh:

```text
+---------------------------------------------------------------+
| QUALITY PERFORMANCE                                           |
+---------------------------------------------------------------+
| DAILY | SHIFT | WEEKLY | MONTHLY                              |
+---------------------------------------------------------------+
|                                                               |
| UNIT CHECK       DEFECT       DPU       DRR                   |
| 1,000            45           0.045     97.20%                |
|                                                               |
| DIRECT RUN       NOT DIRECT RUN       OPEN DEFECT             |
| 972              28                    10                     |
+---------------------------------------------------------------+
```

---

# 23. Dashboard Shift

Dashboard Shift menampilkan perbandingan kedua shift.

| KPI            | Shift 1 | Shift 2 |
| -------------- | ------: | ------: |
| Unit Check     |     500 |     500 |
| Total Defect   |      20 |      25 |
| DPU            |   0,040 |   0,050 |
| Direct Run     |     490 |     482 |
| Not Direct Run |      10 |      18 |
| DRR            |     98% |   96,4% |

---

# 24. Dashboard Group

Dashboard juga menyediakan perbandingan Group:

| KPI        | Group A | Group B |
| ---------- | ------: | ------: |
| Unit Check |     500 |     500 |
| Defect     |      21 |      24 |
| DPU        |   0,042 |   0,048 |
| Direct Run |     491 |     481 |
| DRR        |   98,2% |   96,2% |

---

# 25. Dashboard Shift + Group

Dashboard harus dapat memilih kombinasi:

```text
Date
↓
Shift
↓
Group
↓
Stage / Workstation
↓
Variant
```

Contoh:

```text
26 Aug 2026
Shift 2
Group B
Stage 13
```

Dashboard menampilkan KPI khusus kombinasi tersebut.

---

# 26. Trend DPU

Dashboard harus menyediakan grafik:

**DPU Trend**

Dengan pilihan:

* Daily.
* Shift.
* Weekly.
* Monthly.
* Group A/B.

Contoh:

```text
DPU
 ^
 |       *
 |   *       *
 | *           *
 +----------------------> Time
```

---

# 27. Trend DRR

Dashboard harus menyediakan:

**DRR Trend**

Dengan pilihan:

* Daily.
* Shift.
* Weekly.
* Monthly.
* Group A/B.

Contoh:

```text
DRR
100% |       *---*
 98% |   *--*
 96% | *-
 94% |
     +--------------------> Time
```

---

# 28. Direct Run Monitoring

Dashboard harus menyediakan tabel khusus:

| NIK     | Defect       | Defect Status | Defect POS | Current POS | Direct Run |
| ------- | ------------ | ------------- | ---------- | ----------- | ---------- |
| NIK-001 | Baut longgar | OPEN          | Stage 5    | Stage 13    | NO         |
| NIK-002 | Label        | CLOSED        | Stage 5    | Stage 13    | YES        |

Tujuannya agar Quality/Admin dapat mengetahui **mengapa DRR turun**.

---

# 29. Direct Run Event

Sistem harus mencatat event ketika unit berubah dari Direct Run menjadi Not Direct Run.

Contoh:

```text
NIK-2026-001
       ↓
Defect dibuat di Stage 5
       ↓
Status OPEN
       ↓
Unit masuk Stage 13
       ↓
Defect masih OPEN
       ↓
Direct Run = FALSE
       ↓
DRR Event tercatat
```

Event minimal menyimpan:

* NIK.
* Defect ID.
* Defect POS.
* POS saat defect dianggap melewati.
* Timestamp.
* Shift.
* Group.
* Inspector.
* Status Direct Run.

---

# 30. Aturan Defect untuk DRR

## Rule DRR-01

Defect dibuat → status awal `OPEN`.

## Rule DRR-02

Defect ditutup sebelum unit melewati POS terkait → tidak menyebabkan Not Direct Run.

## Rule DRR-03

Defect masih `OPEN` saat unit melewati POS terkait → unit menjadi Not Direct Run.

## Rule DRR-04

Unit hanya dihitung satu kali sebagai Not Direct Run dalam satu basis KPI, meskipun memiliki beberapa defect.

## Rule DRR-05

Status Direct Run tidak boleh ditentukan hanya berdasarkan waktu defect dibuat.

Status harus mempertimbangkan **posisi proses unit**.

---

# 31. Data Model Tambahan

Untuk mendukung shift dan group, model data perlu diperluas.

## shifts

```text
id
shift_code
shift_name
start_time
end_time
is_overnight
is_active
created_at
updated_at
```

## groups

```text
id
group_code
group_name
is_active
created_at
updated_at
```

Contoh:

```text
A → Group A
B → Group B
```

---

# 32. Update Tabel Users

Tabel `users` diperluas menjadi:

```text
users
------------------------------
id
username
password
full_name
role
default_group_id
is_active
created_at
updated_at
```

Shift tidak wajib disimpan sebagai default permanen pada user karena shift dipilih saat login/sesi.

---

# 33. User Shift Session

Disarankan menggunakan tabel:

```text
user_shift_sessions
--------------------------------
id
user_id
shift_id
group_id
login_time
logout_time
workstation_id
status
created_at
```

Status:

* ACTIVE
* COMPLETED

Tabel ini menjadi referensi untuk menentukan shift/group setiap transaksi.

---

# 34. Update Stage Inspection

`stage_inspections` ditambahkan:

```text
shift_id
group_id
session_id
```

Sehingga struktur menjadi:

```text
stage_inspections
------------------------------
id
unit_nik
workstation_id
variant_id
inspector_id
shift_id
group_id
session_id
cycle_start_time
cycle_end_time
cycle_duration_seconds
delay_duration_seconds
pause_duration_seconds
timing_status
judgment
created_at
```

---

# 35. Update Defect Findings

`defect_findings` diperluas:

```text
defect_findings
------------------------------
id
unit_nik
workstation_id
inspector_id
shift_id
group_id
session_id
defect_description
defect_category
status
resolved_by
resolved_at
resolution_notes
created_at
```

Field tambahan Direct Run:

```text
direct_run_status
direct_run_evaluated_at
direct_run_breach_stage_id
```

Contoh status:

* PENDING
* DIRECT_RUN
* NOT_DIRECT_RUN

---

# 36. Direct Run Event Table

Disarankan membuat tabel khusus:

```text
direct_run_events
--------------------------------
id
unit_nik
defect_id
defect_workstation_id
breach_workstation_id
inspector_id
shift_id
group_id
event_time
status
created_at
```

Contoh:

```text
defect_workstation = STAGE_5
breach_workstation = STAGE_13
status = NOT_DIRECT_RUN
```

---

# 37. KPI Query Logic

## DPU

```sql
DPU = Total Defect / Total Unit Check
```

## Direct Run Unit

```sql
Direct Run Unit =
Unit Check - Distinct Unit Not Direct Run
```

## DRR

```sql
DRR =
(
  Direct Run Unit
  /
  Unit Check
) * 100
```

Perhitungan harus menggunakan:

`COUNT(DISTINCT unit_nik)`

untuk unit Direct Run/Not Direct Run.

---

# 38. Contoh Query Konseptual DRR

```sql
SELECT
    COUNT(DISTINCT uc.unit_nik) AS unit_check,
    COUNT(DISTINCT dre.unit_nik) AS not_direct_run,

    (
        COUNT(DISTINCT uc.unit_nik)
        -
        COUNT(DISTINCT dre.unit_nik)
    ) AS direct_run_unit,

    (
        (
            COUNT(DISTINCT uc.unit_nik)
            -
            COUNT(DISTINCT dre.unit_nik)
        )
        /
        COUNT(DISTINCT uc.unit_nik)
    ) * 100 AS drr

FROM unit_checks uc
LEFT JOIN direct_run_events dre
    ON dre.unit_nik = uc.unit_nik
    AND dre.event_time BETWEEN :start_date AND :end_date

WHERE uc.check_time BETWEEN :start_date AND :end_date;
```

Implementasi final harus menyesuaikan struktur transaksi aktual dan aturan POS yang digunakan untuk mendefinisikan unit check.

---

# 39. API Login

```text
POST /api/auth/login
```

Request:

```json
{
  "username": "INS001",
  "password": "******",
  "shift_id": 1,
  "group_id": 1
}
```

Response menyimpan:

```json
{
  "user_id": 10,
  "role": "inspector",
  "shift_id": 1,
  "group_id": 1,
  "session_id": 5001
}
```

---

# 40. API Shift

```text
GET    /api/shifts
POST   /api/shifts
PUT    /api/shifts/:id
PATCH  /api/shifts/:id/status
```

Admin dapat mengatur:

* Nama shift.
* Jam mulai.
* Jam selesai.
* Overnight.
* Status aktif.

---

# 41. API Group

```text
GET    /api/groups
POST   /api/groups
PUT    /api/groups/:id
PATCH  /api/groups/:id/status
```

Untuk MVP, data awal:

```text
Group A
Group B
```

---

# 42. API KPI

```text
GET /api/kpi/quality
```

Parameter:

```text
start_date
end_date
period
shift_id
group_id
workstation_id
variant_id
inspector_id
```

Response minimal:

```json
{
  "unit_check": 1000,
  "total_defect": 45,
  "dpu": 0.045,
  "direct_run_unit": 972,
  "not_direct_run_unit": 28,
  "drr": 97.2,
  "open_defect": 10,
  "closed_defect": 35
}
```

---

# 43. API Direct Run

```text
GET /api/kpi/direct-run
GET /api/direct-run/events
GET /api/units/:nik/direct-run
```

Fungsinya:

* Menampilkan unit Not Direct Run.
* Menampilkan penyebab.
* Menampilkan defect terkait.
* Menampilkan POS asal defect.
* Menampilkan POS saat breach terjadi.
* Menampilkan shift/group.

---

# 44. Business Rules Shift

### BR-SHIFT-01

Satu hari memiliki dua shift aktif.

### BR-SHIFT-02

Jam shift ditentukan Admin.

### BR-SHIFT-03

Shift dapat melewati tengah malam.

### BR-SHIFT-04

User harus memilih shift saat login.

### BR-SHIFT-05

User harus memilih Group A atau Group B saat login.

### BR-SHIFT-06

Shift dan group yang dipilih menjadi bagian dari session.

### BR-SHIFT-07

Semua transaksi selama session mewarisi shift dan group tersebut.

### BR-SHIFT-08

User tidak boleh mengganti shift tanpa mengakhiri session.

---

# 45. Functional Requirements Tambahan

## FR-23 Master Shift

Admin dapat:

* Membuat shift.
* Mengedit shift.
* Menentukan jam mulai/selesai.
* Menentukan overnight.
* Mengaktifkan/nonaktifkan shift.

---

## FR-24 User Login Shift

Login harus meminta:

* Username.
* Password.
* Shift.
* Group.

---

## FR-25 Shift Session

Sistem harus membuat session baru ketika user berhasil login.

---

## FR-26 Group Session

Sistem harus menyimpan Group A/B pada session.

---

## FR-27 Direct Run Evaluation

Sistem harus mengevaluasi Direct Run berdasarkan status defect dan posisi unit pada proses.

---

## FR-28 DRR Event

Ketika unit membawa defect OPEN melewati POS terkait, sistem harus membuat event Not Direct Run.

---

## FR-29 DPU Shift

DPU harus dapat dihitung berdasarkan shift.

---

## FR-30 DRR Shift

DRR harus dapat dihitung berdasarkan shift.

---

## FR-31 KPI Group

DPU dan DRR harus dapat difilter berdasarkan Group A/B.

---

## FR-32 KPI Combined Filter

Dashboard harus mendukung kombinasi:

```text
Date
+
Shift
+
Group
+
Stage
+
Variant
```

---

# 46. Dashboard Utama

Dashboard Admin direkomendasikan memiliki struktur:

```text
+================================================================+
|                    TCF N-SERIES DASHBOARD                      |
+================================================================+

Filter:
[Date] [Shift] [Group] [Stage] [Variant] [Inspector]

+----------------+----------------+----------------+--------------+
| UNIT CHECK     | TOTAL DEFECT   | DPU            | DRR          |
| 1,000          | 45             | 0.045          | 97.20%       |
+----------------+----------------+----------------+--------------+

+----------------+----------------+----------------+--------------+
| DIRECT RUN     | NOT DIRECT RUN | OPEN DEFECT    | CLOSED       |
| 972            | 28             | 10             | 35           |
+----------------+----------------+----------------+--------------+

+----------------------------------------------------------------+
|                    DPU TREND                                   |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
|                    DRR TREND                                   |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
|                 DIRECT RUN EXCEPTION                           |
+----------------------------------------------------------------+

| NIK | Defect | POS Asal | POS Breach | Shift | Group | Status |
+----------------------------------------------------------------+
```

---

# 47. KPI Period Selection

Dashboard harus menyediakan:

```text
[ Daily ]
[ Shift ]
[ Weekly ]
[ Monthly ]
```

Saat **Shift** dipilih, user dapat melihat:

```text
Date
Shift 1 / Shift 2
Group A / Group B
```

---

# 48. KPI Daily

Daily menampilkan:

* Unit Check hari itu.
* Defect hari itu.
* DPU hari itu.
* Direct Run Unit.
* Not Direct Run Unit.
* DRR.
* Open Defect.
* Closed Defect.

---

# 49. KPI Weekly

Weekly merupakan kumulatif dari awal minggu sampai tanggal yang dipilih.

Contoh:

```text
Week 35
24 Aug – 30 Aug 2026
```

Bisa difilter:

* Shift 1.
* Shift 2.
* Group A.
* Group B.

---

# 50. KPI Monthly

Monthly merupakan kumulatif dari:

**Tanggal 1 → tanggal yang dipilih**

Contoh:

```text
August 2026
```

KPI dapat dibreakdown berdasarkan:

* Shift.
* Group.
* Stage.
* Variant.

---

# 51. KPI Comparison

Dashboard harus memungkinkan perbandingan:

### Shift

```text
Shift 1 vs Shift 2
```

### Group

```text
Group A vs Group B
```

### Stage

```text
Stage 5 vs Stage 13 vs Stage 21
```

Tujuannya untuk menemukan:

* Shift dengan DPU tertinggi.
* Shift dengan DRR terendah.
* Group dengan defect tertinggi.
* Stage yang paling sering menghasilkan Not Direct Run.

---

# 52. Acceptance Criteria — DPU

### AC-DPU-01

Jika:

* Unit Check = 100.
* Total Defect = 8.

Maka:

**DPU = 0,08**

### AC-DPU-02

Jika Group A mempunyai 50 unit dan 4 defect:

**DPU Group A = 0,08**

### AC-DPU-03

Jika Shift 2 mempunyai 100 unit dan 3 defect:

**DPU Shift 2 = 0,03**

---

# 53. Acceptance Criteria — DRR

### AC-DRR-01

100 unit cek.

95 unit Direct Run.

5 unit Not Direct Run.

Maka:

**DRR = 95%**

### AC-DRR-02

Satu unit memiliki 3 defect OPEN yang menyebabkan unit melewati POS terkait.

Unit tersebut dihitung:

**1 Not Direct Run**

bukan 3.

### AC-DRR-03

Defect CLOSED sebelum unit melewati POS terkait.

Unit tetap:

**Direct Run**

### AC-DRR-04

Defect masih OPEN ketika unit melewati POS terkait.

Unit menjadi:

**Not Direct Run**

### AC-DRR-05

Defect OPEN tetapi unit belum melewati POS terkait.

Unit belum dikategorikan Not Direct Run berdasarkan event tersebut.

---

# 54. Acceptance Criteria — Shift

### AC-SHIFT-01

Admin dapat membuat dua shift.

### AC-SHIFT-02

Admin dapat mengubah jam shift.

### AC-SHIFT-03

User memilih shift saat login.

### AC-SHIFT-04

User memilih Group A atau Group B.

### AC-SHIFT-05

Semua transaksi menyimpan shift dan group.

### AC-SHIFT-06

Shift yang melewati tengah malam tetap dihitung sebagai satu shift.

---

# 55. Acceptance Criteria — Dashboard

Dashboard harus dapat menampilkan:

* Daily DPU.
* Daily DRR.
* Weekly DPU.
* Weekly DRR.
* Monthly DPU.
* Monthly DRR.
* Shift 1 DPU/DRR.
* Shift 2 DPU/DRR.
* Group A DPU/DRR.
* Group B DPU/DRR.

Dashboard juga harus dapat menampilkan penyebab unit Not Direct Run.

---

# 56. Test Scenario Tambahan

| ID    | Scenario                                           | Expected Result                         |
| ----- | -------------------------------------------------- | --------------------------------------- |
| TC-27 | Defect OPEN di Stage 5 lalu unit melewati Stage 13 | Unit menjadi Not Direct Run             |
| TC-28 | Defect CLOSED sebelum Stage 13                     | Unit tetap Direct Run                   |
| TC-29 | Defect OPEN tetapi unit belum melewati POS terkait | Belum menjadi Not Direct Run            |
| TC-30 | Satu unit memiliki 3 defect                        | Maksimal 1 Not Direct Run pada KPI unit |
| TC-31 | Login Shift 1 Group A                              | Session menyimpan Shift 1 + Group A     |
| TC-32 | Login Shift 2 Group B                              | Session menyimpan Shift 2 + Group B     |
| TC-33 | Shift overnight                                    | Transaksi tetap masuk shift yang benar  |
| TC-34 | Dashboard Shift 1                                  | KPI hanya Shift 1                       |
| TC-35 | Dashboard Group A                                  | KPI hanya Group A                       |
| TC-36 | Dashboard Shift + Group                            | KPI sesuai kombinasi                    |
| TC-37 | Weekly cumulative                                  | Semua data sejak awal minggu terhitung  |
| TC-38 | Monthly cumulative                                 | Semua data sejak tanggal 1 terhitung    |

---

# 57. Update KPI Produk

Dengan penambahan Shift, Group, dan Direct Run Ratio, KPI aplikasi menjadi:

## Production Performance

* Actual Cycle Time.
* Takt Time.
* Over Cycle Rate.
* Delay Time.

## Quality Performance

* Unit Check.
* Total Defect.
* DPU.
* Direct Run Unit.
* Not Direct Run Unit.
* DRR.
* Open Defect.
* Closed Defect.

## Workforce / Shift Performance

* Performance per Shift.
* Performance Group A.
* Performance Group B.
* Performance per Inspector.

## Traceability Performance

* Traceability Coverage.
* Inspection Compliance.
* Unit History.
* Direct Run History.

---

# 58. Definition of MVP

MVP dinyatakan memenuhi kebutuhan apabila sistem dapat menjalankan:

```text
LOGIN
  ↓
PILIH SHIFT
  ↓
PILIH GROUP A / GROUP B
  ↓
PILIH WORKSTATION
  ↓
PILIH VARIANT
  ↓
SCAN NIK
  ↓
INSPECTION
  ↓
DEFECT MANAGEMENT
  ↓
DETECT OPEN DEFECT PASSED POS
  ↓
DIRECT RUN / NOT DIRECT RUN
  ↓
DPU + DRR
  ↓
DAILY / SHIFT / WEEKLY / MONTHLY
  ↓
DASHBOARD
```

---

# 59. Success Criteria

Implementasi dianggap berhasil apabila:

1. Setiap transaksi memiliki identitas user, shift, dan group.
2. Admin dapat menentukan konfigurasi dua shift per hari.
3. User memilih shift saat login.
4. User memilih Group A atau Group B saat login.
5. Sistem dapat mengenali shift overnight.
6. Defect OPEN dapat dipantau terhadap posisi unit.
7. Sistem dapat menentukan kapan unit tidak lagi Direct Run.
8. Unit yang tidak Direct Run hanya dihitung satu kali dalam KPI DRR.
9. DPU dapat dihitung dengan benar.
10. DRR dapat dihitung dengan benar.
11. DPU tersedia harian, shift, mingguan, dan bulanan.
12. DRR tersedia harian, shift, mingguan, dan bulanan.
13. KPI dapat difilter berdasarkan Group A/B.
14. KPI dapat difilter berdasarkan Shift.
15. Dashboard dapat menunjukkan penyebab penurunan DRR.
16. Seluruh data KPI dapat ditelusuri kembali sampai ke NIK dan defect/event asalnya.

---

# 60. Kesimpulan

Dengan perubahan ini, aplikasi tidak lagi hanya berfungsi sebagai **Traceability & Cycle Timer System**, tetapi menjadi sistem yang dapat memonitor hubungan antara:

**Production → Inspection → Defect → Direct Run → Quality KPI → Shift Performance**

Fokus utama DRR adalah memastikan unit dapat **langsung berjalan melewati proses tanpa membawa defect OPEN melewati POS yang terkait**.

Struktur KPI akhir:

```text
                 TCF N-SERIES
                       │
              ┌────────┴────────┐
              │                 │
          TRACEABILITY       QUALITY
              │                 │
              │          ┌──────┴──────┐
              │          │             │
              │         DPU           DRR
              │          │             │
              │     Defect/Unit   Direct Run %
              │                        │
              └────────┬───────────────┘
                       │
                  SHIFT / GROUP
                       │
             ┌─────────┼─────────┐
             │         │         │
           DAILY     WEEKLY    MONTHLY
```

Sistem akhirnya dapat menjawab bukan hanya **“apa defect yang terjadi pada unit?”**, tetapi juga **“apakah defect tersebut menyebabkan unit tidak Direct Run, di shift/group mana hal tersebut terjadi, dan bagaimana dampaknya terhadap DPU serta DRR?”**
