using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class EventAddNumberOfDaysRemoveAcademicYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_AcademicYears_AcademicYearId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_AcademicYearId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "AcademicYearId",
                table: "Events");

            migrationBuilder.AddColumn<int>(
                name: "NumberOfDays",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumberOfDays",
                table: "Events");

            migrationBuilder.AddColumn<int>(
                name: "AcademicYearId",
                table: "Events",
                type: "int",
                nullable: true);

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
    }
}
