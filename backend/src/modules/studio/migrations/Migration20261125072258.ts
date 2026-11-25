import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125072258 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "studio" drop constraint if exists "studio_handle_unique";`);
    this.addSql(`create table if not exists "studio" ("id" text not null, "name" text not null, "handle" text not null, "description" text null, "logo_url" text null, "cover_url" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "studio_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_studio_handle_unique" ON "studio" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_studio_deleted_at" ON "studio" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "studio" cascade;`);
  }

}
