declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CAPTURE_TOKEN?: string;
    ENROLMENT_CODE?: string;
  }
}
