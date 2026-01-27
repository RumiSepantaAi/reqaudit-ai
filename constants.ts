import { Requirement } from './types';

export const SAMPLE_DATA: Requirement[] = [
  {
    "req_id": "R-001",
    "source_doc": "Doc1",
    "section": "1.0 Einleitung: Source of Truth (SoT)",
    "category": "Architektur",
    "subcategory": "System-of-Record",
    "criticality": "MUST",
    "text_original": "Source of Truth (SoT): Die zentrale, relationale Datenbank (Postgres), die alle kanonischen Metadaten, versionierten Dokumente, extrahierten Artefakte und deren Abstammung (Lineage) als maßgebliche Quelle vorhält.",
    "ctonote": "DB ist alleinige maßgebliche Quelle für kanonische Metadaten/Artefakte."
  },
  {
    "req_id": "R-002",
    "source_doc": "Doc1",
    "section": "2.0 Architektonische Leitprinzipien: Auditierbarkeit",
    "category": "Governance",
    "subcategory": "Auditability",
    "criticality": "MUST",
    "text_original": "Jede Information, jeder extrahierte Claim und jedes generierte Artefakt muss lückenlos auf seinen Ursprung zurückführbar sein. Dies umfasst die genaue Quelle, die Dokumentenversion (sha256).",
    "ctonote": "Lineage-Felder müssen immutable sein."
  },
  {
    "req_id": "R-003",
    "source_doc": "Doc2",
    "section": "3.5 API Standards",
    "category": "Development",
    "subcategory": "API Design",
    "criticality": "SHOULD",
    "text_original": "Alle externen Schnittstellen sollten dem RESTful Standard entsprechen und mittels OpenAPI 3.0 spezifiziert werden.",
    "ctonote": "gRPC für interne Kommunikation zulässig."
  },
  {
    "req_id": "R-004",
    "source_doc": "Doc1",
    "section": "4.1 Sicherheit",
    "category": "Security",
    "subcategory": "Encryption",
    "criticality": "MUST",
    "text_original": "Daten im Ruhezustand (Data at Rest) müssen mit AES-256 verschlüsselt werden.",
    "ctonote": "KMS Key Rotation jährlich."
  },
  {
    "req_id": "R-005",
    "source_doc": "Doc3",
    "section": "2.2 Performance",
    "category": "Architektur",
    "subcategory": "Latency",
    "criticality": "SHOULD",
    "text_original": "Die Antwortzeit der API Endpunkte sollte im 99. Perzentil unter 200ms liegen.",
    "ctonote": "Gilt nicht für Batch-Processing."
  }
];
