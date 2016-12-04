--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.5
-- Dumped by pg_dump version 9.5.5

-- Started on 2016-12-04 12:27:51 MSK

SET statement_timeout = 0;
-- SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
-- SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 12395)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2159 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 181 (class 1259 OID 16525)
-- Name: child; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE child (
    id integer NOT NULL,
    main_id integer NOT NULL,
    field character varying
);


ALTER TABLE child OWNER TO postgres;

--
-- TOC entry 2160 (class 0 OID 0)
-- Dependencies: 181
-- Name: TABLE child; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE child IS 'test table';


--
-- TOC entry 182 (class 1259 OID 16531)
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
-- TOC entry 2161 (class 0 OID 0)
-- Dependencies: 182
-- Name: child_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE child_id_seq OWNED BY child.id;


--
-- TOC entry 183 (class 1259 OID 16533)
-- Name: main; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE main (
    id integer NOT NULL,
    name character varying
);


ALTER TABLE main OWNER TO postgres;

--
-- TOC entry 2162 (class 0 OID 0)
-- Dependencies: 183
-- Name: TABLE main; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE main IS 'test table';


--
-- TOC entry 184 (class 1259 OID 16539)
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
-- TOC entry 2163 (class 0 OID 0)
-- Dependencies: 184
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE test_id_seq OWNED BY main.id;


--
-- TOC entry 2027 (class 2604 OID 16541)
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child ALTER COLUMN id SET DEFAULT nextval('child_id_seq'::regclass);


--
-- TOC entry 2028 (class 2604 OID 16542)
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY main ALTER COLUMN id SET DEFAULT nextval('test_id_seq'::regclass);


--
-- TOC entry 2148 (class 0 OID 16525)
-- Dependencies: 181
-- Data for Name: child; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY child (id, main_id, field) FROM stdin;
1	1	field value
2	1	field value 2
3	2	super value
\.


--
-- TOC entry 2164 (class 0 OID 0)
-- Dependencies: 182
-- Name: child_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('child_id_seq', 3, true);


--
-- TOC entry 2150 (class 0 OID 16533)
-- Dependencies: 183
-- Data for Name: main; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY main (id, name) FROM stdin;
1	row1
2	row2
3	another row
\.


--
-- TOC entry 2165 (class 0 OID 0)
-- Dependencies: 184
-- Name: test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('test_id_seq', 3, true);


--
-- TOC entry 2030 (class 2606 OID 16544)
-- Name: child_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child
    ADD CONSTRAINT child_pkey PRIMARY KEY (id);


--
-- TOC entry 2032 (class 2606 OID 16546)
-- Name: test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY main
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- TOC entry 2033 (class 2606 OID 16547)
-- Name: child_main_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY child
    ADD CONSTRAINT child_main_id_fk FOREIGN KEY (main_id) REFERENCES main(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2158 (class 0 OID 0)
-- Dependencies: 7
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2016-12-04 12:27:51 MSK

--
-- PostgreSQL database dump complete
--

