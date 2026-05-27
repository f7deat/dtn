using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class AcademicYearTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcademicYearId",
                table: "Events",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AcademicYears",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcademicYears", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_AcademicYearId",
                table: "Events",
                column: "AcademicYearId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_AcademicYears_AcademicYearId",
                table: "Events",
                column: "AcademicYearId",
                principalTable: "AcademicYears",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_AcademicYears_AcademicYearId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "AcademicYears");

            migrationBuilder.DropIndex(
                name: "IX_Events_AcademicYearId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "AcademicYearId",
                table: "Events");
        }
    }
}
