using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Infrastructure.Migrations
{
    public partial class AddEventCheckout : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedOutAt",
                table: "UserEvents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CheckedOutBy",
                table: "UserEvents",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckedOutAt",
                table: "UserEvents");

            migrationBuilder.DropColumn(
                name: "CheckedOutBy",
                table: "UserEvents");
        }
    }
}