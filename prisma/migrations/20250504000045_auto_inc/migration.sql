-- AlterTable
CREATE SEQUENCE paragraph_id_seq;
ALTER TABLE "Paragraph" ALTER COLUMN "id" SET DEFAULT nextval('paragraph_id_seq');
ALTER SEQUENCE paragraph_id_seq OWNED BY "Paragraph"."id";

-- AlterTable
CREATE SEQUENCE pdf_id_seq;
ALTER TABLE "Pdf" ALTER COLUMN "id" SET DEFAULT nextval('pdf_id_seq');
ALTER SEQUENCE pdf_id_seq OWNED BY "Pdf"."id";
