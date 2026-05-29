using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class AddSemesterIdToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SemesterId",
                table: "Events",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_SemesterId",
                table: "Events",
                column: "SemesterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Semesters_SemesterId",
                table: "Events",
                column: "SemesterId",
                principalTable: "Semesters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Semesters_SemesterId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_SemesterId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "SemesterId",
                table: "Events");
        }
    }
}
