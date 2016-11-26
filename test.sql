--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: child; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE child (
    id integer NOT NULL,
    main_id integer NOT NULL,
    field character varying
);


ALTER TABLE child OWNER TO postgres;

--
-- Name: TABLE child; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE child IS 'test table';


--
-- Name: child_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE child_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE child_id_seq OWNER TO postgres;

--
-- Name: child_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE child_id_seq OWNED BY child.id;


--
-- Name: main; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE main (
    id integer NOT NULL,
    name character varying
);


ALTER TABLE main OWNER TO postgres;

--
-- Name: TABLE main; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE main IS 'test table';


--
-- Name: test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE test_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE test_id_seq OWNER TO postgres;

--
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE test_id_seq OWNED BY main.id;


--
-- Name: child id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child ALTER COLUMN id SET DEFAULT nextval('child_id_seq'::regclass);


--
-- Name: main id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY main ALTER COLUMN id SET DEFAULT nextval('test_id_seq'::regclass);


--
-- Data for Name: child; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY child (id, main_id, field) FROM stdin;
1	1	field value
2	1	field value 2
3	2	super value
\.


--
-- Name: child_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('child_id_seq', 3, true);


--
-- Data for Name: main; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY main (id, name) FROM stdin;
1	row1
2	row2
3	another row
\.


--
-- Name: test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('test_id_seq', 3, true);


--
-- Name: child child_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child
    ADD CONSTRAINT child_pkey PRIMARY KEY (id);


--
-- Name: main test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY main
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: child child_main_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child
    ADD CONSTRAINT child_main_id_fk FOREIGN KEY (main_id) REFERENCES main(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

