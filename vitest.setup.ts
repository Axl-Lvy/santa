process.env.SANTA_DATA_KEY = "00".repeat(32);
process.env.ADMIN_EMAIL = "axel@test.fr";
process.env.APP_URL = "http://localhost:3000";
process.env.DATABASE_PATH = ":memory:";
process.env.DEV_IDENTITY_EMAIL = "axel@test.fr";
import "@testing-library/jest-dom/vitest";
