using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class ContestAllowMultipleSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContestSubmissions_ContestId_UserId",
                table: "ContestSubmissions");

            migrationBuilder.CreateIndex(
                name: "IX_ContestSubmissions_ContestId_UserId",
                table: "ContestSubmissions",
                columns: new[] { "ContestId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContestSubmissions_ContestId_UserId",
                table: "ContestSubmissions");

            migrationBuilder.CreateIndex(
                name: "IX_ContestSubmissions_ContestId_UserId",
                table: "ContestSubmissions",
                columns: new[] { "ContestId", "UserId" },
                unique: true);
        }
    }
}
