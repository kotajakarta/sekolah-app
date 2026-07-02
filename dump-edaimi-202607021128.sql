--
-- PostgreSQL database dump
--

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 17.0

-- Started on 2026-07-02 11:28:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 27251)
-- Name: absensi; Type: SCHEMA; Schema: -; Owner: aithendi
--

CREATE SCHEMA absensi;


ALTER SCHEMA absensi OWNER TO aithendi;

--
-- TOC entry 8 (class 2615 OID 27252)
-- Name: core; Type: SCHEMA; Schema: -; Owner: aithendi
--

CREATE SCHEMA core;


ALTER SCHEMA core OWNER TO aithendi;

--
-- TOC entry 9 (class 2615 OID 27253)
-- Name: formal; Type: SCHEMA; Schema: -; Owner: aithendi
--

CREATE SCHEMA formal;


ALTER SCHEMA formal OWNER TO aithendi;

--
-- TOC entry 6 (class 2615 OID 27250)
-- Name: pesantren; Type: SCHEMA; Schema: -; Owner: aithendi
--

CREATE SCHEMA pesantren;


ALTER SCHEMA pesantren OWNER TO aithendi;

--
-- TOC entry 891 (class 1247 OID 27270)
-- Name: StatusPool; Type: TYPE; Schema: core; Owner: aithendi
--

CREATE TYPE core."StatusPool" AS ENUM (
    'TERSEDIA',
    'AKTIF_CABANG',
    'LULUS',
    'MUTASI',
    'DROP_OUT'
);


ALTER TYPE core."StatusPool" OWNER TO aithendi;

--
-- TOC entry 888 (class 1247 OID 27262)
-- Name: UserDivisi; Type: TYPE; Schema: core; Owner: aithendi
--

CREATE TYPE core."UserDivisi" AS ENUM (
    'FORMAL',
    'PESANTREN',
    'ALL'
);


ALTER TYPE core."UserDivisi" OWNER TO aithendi;

--
-- TOC entry 885 (class 1247 OID 27255)
-- Name: UserScope; Type: TYPE; Schema: core; Owner: aithendi
--

CREATE TYPE core."UserScope" AS ENUM (
    'GLOBAL',
    'WILAYAH',
    'CABANG'
);


ALTER TYPE core."UserScope" OWNER TO aithendi;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 236 (class 1259 OID 27403)
-- Name: log_kehadiran; Type: TABLE; Schema: absensi; Owner: aithendi
--

CREATE TABLE absensi.log_kehadiran (
    id text NOT NULL,
    student_id text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE absensi.log_kehadiran OWNER TO aithendi;

--
-- TOC entry 235 (class 1259 OID 27396)
-- Name: tipe_kegiatan; Type: TABLE; Schema: absensi; Owner: aithendi
--

CREATE TABLE absensi.tipe_kegiatan (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE absensi.tipe_kegiatan OWNER TO aithendi;

--
-- TOC entry 222 (class 1259 OID 27302)
-- Name: biodata; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.biodata (
    id text NOT NULL,
    nik text,
    nis_lokal text,
    no_glodemy text,
    full_name text NOT NULL,
    tempat_lahir text,
    tanggal_lahir timestamp(3) without time zone,
    jenis_kelamin text,
    kewarganegaraan text,
    nama_ayah text,
    status_hidup_ayah text,
    pekerjaan_ayah text,
    pendidikan_ayah text,
    nama_ibu text,
    status_hidup_ibu text,
    pekerjaan_ibu text,
    pendidikan_ibu text,
    address text,
    phone text,
    kontak_darurat_nama text,
    kontak_darurat_telp text,
    kontak_darurat_hubungan text,
    foto_base64 text,
    ijazah_base64 text,
    kk_base64 text
);


ALTER TABLE core.biodata OWNER TO aithendi;

--
-- TOC entry 220 (class 1259 OID 27288)
-- Name: cabang; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.cabang (
    id text NOT NULL,
    name text NOT NULL,
    wilayah_id text
);


ALTER TABLE core.cabang OWNER TO aithendi;

--
-- TOC entry 224 (class 1259 OID 27317)
-- Name: riwayat_pendidikan; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.riwayat_pendidikan (
    id text NOT NULL,
    student_id text NOT NULL,
    cabang_id text,
    tanggal_masuk timestamp(3) without time zone NOT NULL,
    tanggal_keluar timestamp(3) without time zone,
    status_akhir text,
    catatan text
);


ALTER TABLE core.riwayat_pendidikan OWNER TO aithendi;

--
-- TOC entry 225 (class 1259 OID 27324)
-- Name: staff; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.staff (
    id text NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    wilayah_id text,
    cabang_id text,
    grup_daimi_id text,
    ifadah_url text,
    ktp_url text,
    status_pool core."StatusPool" DEFAULT 'TERSEDIA'::core."StatusPool" NOT NULL
);


ALTER TABLE core.staff OWNER TO aithendi;

--
-- TOC entry 223 (class 1259 OID 27309)
-- Name: students; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.students (
    id text NOT NULL,
    biodata_id text NOT NULL,
    wilayah_id text,
    cabang_id text,
    status_pool core."StatusPool" DEFAULT 'TERSEDIA'::core."StatusPool" NOT NULL
);


ALTER TABLE core.students OWNER TO aithendi;

--
-- TOC entry 221 (class 1259 OID 27295)
-- Name: users; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    scope core."UserScope" NOT NULL,
    divisi core."UserDivisi" NOT NULL,
    wilayah_id text,
    cabang_id text
);


ALTER TABLE core.users OWNER TO aithendi;

--
-- TOC entry 219 (class 1259 OID 27281)
-- Name: wilayah; Type: TABLE; Schema: core; Owner: aithendi
--

CREATE TABLE core.wilayah (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE core.wilayah OWNER TO aithendi;

--
-- TOC entry 227 (class 1259 OID 27339)
-- Name: kelas; Type: TABLE; Schema: formal; Owner: aithendi
--

CREATE TABLE formal.kelas (
    id text NOT NULL,
    name text NOT NULL,
    tingkat text,
    is_active boolean DEFAULT true NOT NULL,
    cabang_id text
);


ALTER TABLE formal.kelas OWNER TO aithendi;

--
-- TOC entry 228 (class 1259 OID 27347)
-- Name: mata_pelajaran; Type: TABLE; Schema: formal; Owner: aithendi
--

CREATE TABLE formal.mata_pelajaran (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE formal.mata_pelajaran OWNER TO aithendi;

--
-- TOC entry 229 (class 1259 OID 27354)
-- Name: nilai_formal; Type: TABLE; Schema: formal; Owner: aithendi
--

CREATE TABLE formal.nilai_formal (
    id text NOT NULL,
    student_name text NOT NULL,
    subject text NOT NULL,
    score double precision NOT NULL
);


ALTER TABLE formal.nilai_formal OWNER TO aithendi;

--
-- TOC entry 226 (class 1259 OID 27332)
-- Name: siswa_formal; Type: TABLE; Schema: formal; Owner: aithendi
--

CREATE TABLE formal.siswa_formal (
    id text NOT NULL,
    student_id text NOT NULL,
    kelas_id text,
    nis text,
    nisn text
);


ALTER TABLE formal.siswa_formal OWNER TO aithendi;

--
-- TOC entry 243 (class 1259 OID 29089)
-- Name: cache; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE pesantren.cache OWNER TO aithendi;

--
-- TOC entry 244 (class 1259 OID 29097)
-- Name: cache_locks; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE pesantren.cache_locks OWNER TO aithendi;

--
-- TOC entry 233 (class 1259 OID 27382)
-- Name: data_daimi; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.data_daimi (
    id text NOT NULL,
    student_id text NOT NULL,
    grup_id text,
    kelas_id text,
    nis text
);


ALTER TABLE pesantren.data_daimi OWNER TO aithendi;

--
-- TOC entry 249 (class 1259 OID 29123)
-- Name: failed_jobs; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE pesantren.failed_jobs OWNER TO aithendi;

--
-- TOC entry 248 (class 1259 OID 29122)
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.failed_jobs_id_seq OWNER TO aithendi;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 248
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.failed_jobs_id_seq OWNED BY pesantren.failed_jobs.id;


--
-- TOC entry 231 (class 1259 OID 27368)
-- Name: grup_daimi; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.grup_daimi (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE pesantren.grup_daimi OWNER TO aithendi;

--
-- TOC entry 247 (class 1259 OID 29115)
-- Name: job_batches; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE pesantren.job_batches OWNER TO aithendi;

--
-- TOC entry 246 (class 1259 OID 29106)
-- Name: jobs; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE pesantren.jobs OWNER TO aithendi;

--
-- TOC entry 245 (class 1259 OID 29105)
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.jobs_id_seq OWNER TO aithendi;

--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 245
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.jobs_id_seq OWNED BY pesantren.jobs.id;


--
-- TOC entry 230 (class 1259 OID 27361)
-- Name: kamar; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.kamar (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE pesantren.kamar OWNER TO aithendi;

--
-- TOC entry 232 (class 1259 OID 27375)
-- Name: kelas_daimi; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.kelas_daimi (
    id text NOT NULL,
    name text NOT NULL,
    grup_id text NOT NULL,
    wilayah_id text,
    cabang_id text
);


ALTER TABLE pesantren.kelas_daimi OWNER TO aithendi;

--
-- TOC entry 238 (class 1259 OID 28995)
-- Name: migrations; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE pesantren.migrations OWNER TO aithendi;

--
-- TOC entry 237 (class 1259 OID 28994)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.migrations_id_seq OWNER TO aithendi;

--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 237
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.migrations_id_seq OWNED BY pesantren.migrations.id;


--
-- TOC entry 254 (class 1259 OID 29157)
-- Name: model_has_permissions; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


ALTER TABLE pesantren.model_has_permissions OWNER TO aithendi;

--
-- TOC entry 255 (class 1259 OID 29168)
-- Name: model_has_roles; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


ALTER TABLE pesantren.model_has_roles OWNER TO aithendi;

--
-- TOC entry 234 (class 1259 OID 27389)
-- Name: nilai_kitab; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.nilai_kitab (
    id text NOT NULL,
    score double precision NOT NULL
);


ALTER TABLE pesantren.nilai_kitab OWNER TO aithendi;

--
-- TOC entry 241 (class 1259 OID 29013)
-- Name: password_reset_tokens; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE pesantren.password_reset_tokens OWNER TO aithendi;

--
-- TOC entry 251 (class 1259 OID 29135)
-- Name: permissions; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE pesantren.permissions OWNER TO aithendi;

--
-- TOC entry 250 (class 1259 OID 29134)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.permissions_id_seq OWNER TO aithendi;

--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 250
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.permissions_id_seq OWNED BY pesantren.permissions.id;


--
-- TOC entry 260 (class 1259 OID 29219)
-- Name: personal_access_tokens; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE pesantren.personal_access_tokens OWNER TO aithendi;

--
-- TOC entry 259 (class 1259 OID 29218)
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.personal_access_tokens_id_seq OWNER TO aithendi;

--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 259
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.personal_access_tokens_id_seq OWNED BY pesantren.personal_access_tokens.id;


--
-- TOC entry 258 (class 1259 OID 29195)
-- Name: role_assignment_histories; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.role_assignment_histories (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    scope_id bigint,
    assigned_by bigint NOT NULL,
    assigned_at timestamp(0) without time zone NOT NULL,
    revoked_at timestamp(0) without time zone,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE pesantren.role_assignment_histories OWNER TO aithendi;

--
-- TOC entry 257 (class 1259 OID 29194)
-- Name: role_assignment_histories_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.role_assignment_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.role_assignment_histories_id_seq OWNER TO aithendi;

--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 257
-- Name: role_assignment_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.role_assignment_histories_id_seq OWNED BY pesantren.role_assignment_histories.id;


--
-- TOC entry 256 (class 1259 OID 29179)
-- Name: role_has_permissions; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE pesantren.role_has_permissions OWNER TO aithendi;

--
-- TOC entry 253 (class 1259 OID 29146)
-- Name: roles; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    scope_level character varying(255) DEFAULT 'all'::character varying NOT NULL,
    birim character varying(255)
);


ALTER TABLE pesantren.roles OWNER TO aithendi;

--
-- TOC entry 252 (class 1259 OID 29145)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.roles_id_seq OWNER TO aithendi;

--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 252
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.roles_id_seq OWNED BY pesantren.roles.id;


--
-- TOC entry 242 (class 1259 OID 29020)
-- Name: sessions; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE pesantren.sessions OWNER TO aithendi;

--
-- TOC entry 240 (class 1259 OID 29002)
-- Name: users; Type: TABLE; Schema: pesantren; Owner: aithendi
--

CREATE TABLE pesantren.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    two_factor_secret text,
    two_factor_recovery_codes text,
    two_factor_confirmed_at timestamp(0) without time zone,
    must_setup boolean DEFAULT false NOT NULL,
    pending_email character varying(255),
    pending_password character varying(255),
    wilayah_id bigint,
    sekolah_id bigint,
    penguji_wilayah_id bigint,
    penguji_sekolah_id bigint,
    scope_id bigint,
    personel_kodu character varying(255)
);


ALTER TABLE pesantren.users OWNER TO aithendi;

--
-- TOC entry 239 (class 1259 OID 29001)
-- Name: users_id_seq; Type: SEQUENCE; Schema: pesantren; Owner: aithendi
--

CREATE SEQUENCE pesantren.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pesantren.users_id_seq OWNER TO aithendi;

--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 239
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: pesantren; Owner: aithendi
--

ALTER SEQUENCE pesantren.users_id_seq OWNED BY pesantren.users.id;


--
-- TOC entry 3427 (class 2604 OID 29126)
-- Name: failed_jobs id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.failed_jobs ALTER COLUMN id SET DEFAULT nextval('pesantren.failed_jobs_id_seq'::regclass);


--
-- TOC entry 3426 (class 2604 OID 29109)
-- Name: jobs id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.jobs ALTER COLUMN id SET DEFAULT nextval('pesantren.jobs_id_seq'::regclass);


--
-- TOC entry 3423 (class 2604 OID 28998)
-- Name: migrations id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.migrations ALTER COLUMN id SET DEFAULT nextval('pesantren.migrations_id_seq'::regclass);


--
-- TOC entry 3429 (class 2604 OID 29138)
-- Name: permissions id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.permissions ALTER COLUMN id SET DEFAULT nextval('pesantren.permissions_id_seq'::regclass);


--
-- TOC entry 3433 (class 2604 OID 29222)
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('pesantren.personal_access_tokens_id_seq'::regclass);


--
-- TOC entry 3432 (class 2604 OID 29198)
-- Name: role_assignment_histories id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_assignment_histories ALTER COLUMN id SET DEFAULT nextval('pesantren.role_assignment_histories_id_seq'::regclass);


--
-- TOC entry 3430 (class 2604 OID 29149)
-- Name: roles id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.roles ALTER COLUMN id SET DEFAULT nextval('pesantren.roles_id_seq'::regclass);


--
-- TOC entry 3424 (class 2604 OID 29005)
-- Name: users id; Type: DEFAULT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.users ALTER COLUMN id SET DEFAULT nextval('pesantren.users_id_seq'::regclass);


--
-- TOC entry 3475 (class 2606 OID 27410)
-- Name: log_kehadiran log_kehadiran_pkey; Type: CONSTRAINT; Schema: absensi; Owner: aithendi
--

ALTER TABLE ONLY absensi.log_kehadiran
    ADD CONSTRAINT log_kehadiran_pkey PRIMARY KEY (id);


--
-- TOC entry 3473 (class 2606 OID 27402)
-- Name: tipe_kegiatan tipe_kegiatan_pkey; Type: CONSTRAINT; Schema: absensi; Owner: aithendi
--

ALTER TABLE ONLY absensi.tipe_kegiatan
    ADD CONSTRAINT tipe_kegiatan_pkey PRIMARY KEY (id);


--
-- TOC entry 3443 (class 2606 OID 27308)
-- Name: biodata biodata_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.biodata
    ADD CONSTRAINT biodata_pkey PRIMARY KEY (id);


--
-- TOC entry 3437 (class 2606 OID 27294)
-- Name: cabang cabang_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.cabang
    ADD CONSTRAINT cabang_pkey PRIMARY KEY (id);


--
-- TOC entry 3448 (class 2606 OID 27323)
-- Name: riwayat_pendidikan riwayat_pendidikan_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.riwayat_pendidikan
    ADD CONSTRAINT riwayat_pendidikan_pkey PRIMARY KEY (id);


--
-- TOC entry 3450 (class 2606 OID 27331)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- TOC entry 3446 (class 2606 OID 27316)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 3439 (class 2606 OID 27301)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3435 (class 2606 OID 27287)
-- Name: wilayah wilayah_pkey; Type: CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.wilayah
    ADD CONSTRAINT wilayah_pkey PRIMARY KEY (id);


--
-- TOC entry 3456 (class 2606 OID 27346)
-- Name: kelas kelas_pkey; Type: CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.kelas
    ADD CONSTRAINT kelas_pkey PRIMARY KEY (id);


--
-- TOC entry 3458 (class 2606 OID 27353)
-- Name: mata_pelajaran mata_pelajaran_pkey; Type: CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.mata_pelajaran
    ADD CONSTRAINT mata_pelajaran_pkey PRIMARY KEY (id);


--
-- TOC entry 3460 (class 2606 OID 27360)
-- Name: nilai_formal nilai_formal_pkey; Type: CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.nilai_formal
    ADD CONSTRAINT nilai_formal_pkey PRIMARY KEY (id);


--
-- TOC entry 3453 (class 2606 OID 27338)
-- Name: siswa_formal siswa_formal_pkey; Type: CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.siswa_formal
    ADD CONSTRAINT siswa_formal_pkey PRIMARY KEY (id);


--
-- TOC entry 3493 (class 2606 OID 29103)
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- TOC entry 3490 (class 2606 OID 29095)
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- TOC entry 3468 (class 2606 OID 27388)
-- Name: data_daimi data_daimi_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.data_daimi
    ADD CONSTRAINT data_daimi_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 2606 OID 29131)
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3502 (class 2606 OID 29133)
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- TOC entry 3464 (class 2606 OID 27374)
-- Name: grup_daimi grup_daimi_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.grup_daimi
    ADD CONSTRAINT grup_daimi_pkey PRIMARY KEY (id);


--
-- TOC entry 3498 (class 2606 OID 29121)
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- TOC entry 3495 (class 2606 OID 29113)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3462 (class 2606 OID 27367)
-- Name: kamar kamar_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.kamar
    ADD CONSTRAINT kamar_pkey PRIMARY KEY (id);


--
-- TOC entry 3466 (class 2606 OID 27381)
-- Name: kelas_daimi kelas_daimi_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.kelas_daimi
    ADD CONSTRAINT kelas_daimi_pkey PRIMARY KEY (id);


--
-- TOC entry 3477 (class 2606 OID 29000)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3513 (class 2606 OID 29167)
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- TOC entry 3516 (class 2606 OID 29178)
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- TOC entry 3471 (class 2606 OID 27395)
-- Name: nilai_kitab nilai_kitab_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.nilai_kitab
    ADD CONSTRAINT nilai_kitab_pkey PRIMARY KEY (id);


--
-- TOC entry 3483 (class 2606 OID 29019)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- TOC entry 3504 (class 2606 OID 29144)
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- TOC entry 3506 (class 2606 OID 29142)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3523 (class 2606 OID 29226)
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3525 (class 2606 OID 29229)
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- TOC entry 3520 (class 2606 OID 29202)
-- Name: role_assignment_histories role_assignment_histories_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_assignment_histories
    ADD CONSTRAINT role_assignment_histories_pkey PRIMARY KEY (id);


--
-- TOC entry 3518 (class 2606 OID 29193)
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- TOC entry 3508 (class 2606 OID 29156)
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- TOC entry 3510 (class 2606 OID 29154)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3486 (class 2606 OID 29026)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3479 (class 2606 OID 29012)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3481 (class 2606 OID 29010)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3441 (class 1259 OID 27412)
-- Name: biodata_nik_key; Type: INDEX; Schema: core; Owner: aithendi
--

CREATE UNIQUE INDEX biodata_nik_key ON core.biodata USING btree (nik);


--
-- TOC entry 3444 (class 1259 OID 27413)
-- Name: students_biodata_id_key; Type: INDEX; Schema: core; Owner: aithendi
--

CREATE UNIQUE INDEX students_biodata_id_key ON core.students USING btree (biodata_id);


--
-- TOC entry 3440 (class 1259 OID 27411)
-- Name: users_username_key; Type: INDEX; Schema: core; Owner: aithendi
--

CREATE UNIQUE INDEX users_username_key ON core.users USING btree (username);


--
-- TOC entry 3451 (class 1259 OID 27415)
-- Name: siswa_formal_nisn_key; Type: INDEX; Schema: formal; Owner: aithendi
--

CREATE UNIQUE INDEX siswa_formal_nisn_key ON formal.siswa_formal USING btree (nisn);


--
-- TOC entry 3454 (class 1259 OID 27414)
-- Name: siswa_formal_student_id_key; Type: INDEX; Schema: formal; Owner: aithendi
--

CREATE UNIQUE INDEX siswa_formal_student_id_key ON formal.siswa_formal USING btree (student_id);


--
-- TOC entry 3488 (class 1259 OID 29096)
-- Name: cache_expiration_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX cache_expiration_index ON pesantren.cache USING btree (expiration);


--
-- TOC entry 3491 (class 1259 OID 29104)
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX cache_locks_expiration_index ON pesantren.cache_locks USING btree (expiration);


--
-- TOC entry 3469 (class 1259 OID 27416)
-- Name: data_daimi_student_id_key; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE UNIQUE INDEX data_daimi_student_id_key ON pesantren.data_daimi USING btree (student_id);


--
-- TOC entry 3496 (class 1259 OID 29114)
-- Name: jobs_queue_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX jobs_queue_index ON pesantren.jobs USING btree (queue);


--
-- TOC entry 3511 (class 1259 OID 29160)
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON pesantren.model_has_permissions USING btree (model_id, model_type);


--
-- TOC entry 3514 (class 1259 OID 29171)
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX model_has_roles_model_id_model_type_index ON pesantren.model_has_roles USING btree (model_id, model_type);


--
-- TOC entry 3521 (class 1259 OID 29230)
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX personal_access_tokens_expires_at_index ON pesantren.personal_access_tokens USING btree (expires_at);


--
-- TOC entry 3526 (class 1259 OID 29227)
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON pesantren.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- TOC entry 3484 (class 1259 OID 29028)
-- Name: sessions_last_activity_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX sessions_last_activity_index ON pesantren.sessions USING btree (last_activity);


--
-- TOC entry 3487 (class 1259 OID 29027)
-- Name: sessions_user_id_index; Type: INDEX; Schema: pesantren; Owner: aithendi
--

CREATE INDEX sessions_user_id_index ON pesantren.sessions USING btree (user_id);


--
-- TOC entry 3547 (class 2606 OID 27517)
-- Name: log_kehadiran log_kehadiran_student_id_fkey; Type: FK CONSTRAINT; Schema: absensi; Owner: aithendi
--

ALTER TABLE ONLY absensi.log_kehadiran
    ADD CONSTRAINT log_kehadiran_student_id_fkey FOREIGN KEY (student_id) REFERENCES core.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3527 (class 2606 OID 28568)
-- Name: cabang cabang_wilayah_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.cabang
    ADD CONSTRAINT cabang_wilayah_id_fkey FOREIGN KEY (wilayah_id) REFERENCES core.wilayah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3533 (class 2606 OID 28578)
-- Name: riwayat_pendidikan riwayat_pendidikan_cabang_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.riwayat_pendidikan
    ADD CONSTRAINT riwayat_pendidikan_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3534 (class 2606 OID 27447)
-- Name: riwayat_pendidikan riwayat_pendidikan_student_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.riwayat_pendidikan
    ADD CONSTRAINT riwayat_pendidikan_student_id_fkey FOREIGN KEY (student_id) REFERENCES core.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3535 (class 2606 OID 27462)
-- Name: staff staff_cabang_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.staff
    ADD CONSTRAINT staff_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3536 (class 2606 OID 27467)
-- Name: staff staff_grup_daimi_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.staff
    ADD CONSTRAINT staff_grup_daimi_id_fkey FOREIGN KEY (grup_daimi_id) REFERENCES pesantren.grup_daimi(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3537 (class 2606 OID 27457)
-- Name: staff staff_wilayah_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.staff
    ADD CONSTRAINT staff_wilayah_id_fkey FOREIGN KEY (wilayah_id) REFERENCES core.wilayah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3530 (class 2606 OID 27432)
-- Name: students students_biodata_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.students
    ADD CONSTRAINT students_biodata_id_fkey FOREIGN KEY (biodata_id) REFERENCES core.biodata(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3531 (class 2606 OID 27442)
-- Name: students students_cabang_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.students
    ADD CONSTRAINT students_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3532 (class 2606 OID 28573)
-- Name: students students_wilayah_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.students
    ADD CONSTRAINT students_wilayah_id_fkey FOREIGN KEY (wilayah_id) REFERENCES core.wilayah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3528 (class 2606 OID 27427)
-- Name: users users_cabang_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3529 (class 2606 OID 27422)
-- Name: users users_wilayah_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: aithendi
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_wilayah_id_fkey FOREIGN KEY (wilayah_id) REFERENCES core.wilayah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3540 (class 2606 OID 27482)
-- Name: kelas kelas_cabang_id_fkey; Type: FK CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.kelas
    ADD CONSTRAINT kelas_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3538 (class 2606 OID 27477)
-- Name: siswa_formal siswa_formal_kelas_id_fkey; Type: FK CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.siswa_formal
    ADD CONSTRAINT siswa_formal_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES formal.kelas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3539 (class 2606 OID 27472)
-- Name: siswa_formal siswa_formal_student_id_fkey; Type: FK CONSTRAINT; Schema: formal; Owner: aithendi
--

ALTER TABLE ONLY formal.siswa_formal
    ADD CONSTRAINT siswa_formal_student_id_fkey FOREIGN KEY (student_id) REFERENCES core.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3544 (class 2606 OID 27507)
-- Name: data_daimi data_daimi_grup_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.data_daimi
    ADD CONSTRAINT data_daimi_grup_id_fkey FOREIGN KEY (grup_id) REFERENCES pesantren.grup_daimi(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3545 (class 2606 OID 27512)
-- Name: data_daimi data_daimi_kelas_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.data_daimi
    ADD CONSTRAINT data_daimi_kelas_id_fkey FOREIGN KEY (kelas_id) REFERENCES pesantren.kelas_daimi(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3546 (class 2606 OID 27502)
-- Name: data_daimi data_daimi_student_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.data_daimi
    ADD CONSTRAINT data_daimi_student_id_fkey FOREIGN KEY (student_id) REFERENCES core.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3541 (class 2606 OID 27497)
-- Name: kelas_daimi kelas_daimi_cabang_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.kelas_daimi
    ADD CONSTRAINT kelas_daimi_cabang_id_fkey FOREIGN KEY (cabang_id) REFERENCES core.cabang(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3542 (class 2606 OID 27487)
-- Name: kelas_daimi kelas_daimi_grup_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.kelas_daimi
    ADD CONSTRAINT kelas_daimi_grup_id_fkey FOREIGN KEY (grup_id) REFERENCES pesantren.grup_daimi(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3543 (class 2606 OID 27492)
-- Name: kelas_daimi kelas_daimi_wilayah_id_fkey; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.kelas_daimi
    ADD CONSTRAINT kelas_daimi_wilayah_id_fkey FOREIGN KEY (wilayah_id) REFERENCES core.wilayah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3548 (class 2606 OID 29161)
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES pesantren.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 3549 (class 2606 OID 29172)
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES pesantren.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3552 (class 2606 OID 29213)
-- Name: role_assignment_histories role_assignment_histories_assigned_by_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_assignment_histories
    ADD CONSTRAINT role_assignment_histories_assigned_by_foreign FOREIGN KEY (assigned_by) REFERENCES pesantren.users(id) ON DELETE CASCADE;


--
-- TOC entry 3553 (class 2606 OID 29208)
-- Name: role_assignment_histories role_assignment_histories_role_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_assignment_histories
    ADD CONSTRAINT role_assignment_histories_role_id_foreign FOREIGN KEY (role_id) REFERENCES pesantren.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3554 (class 2606 OID 29203)
-- Name: role_assignment_histories role_assignment_histories_user_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_assignment_histories
    ADD CONSTRAINT role_assignment_histories_user_id_foreign FOREIGN KEY (user_id) REFERENCES pesantren.users(id) ON DELETE CASCADE;


--
-- TOC entry 3550 (class 2606 OID 29182)
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES pesantren.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 3551 (class 2606 OID 29187)
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: pesantren; Owner: aithendi
--

ALTER TABLE ONLY pesantren.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES pesantren.roles(id) ON DELETE CASCADE;


-- Completed on 2026-07-02 11:28:33

--
-- PostgreSQL database dump complete
--

