using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class AddEventType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EventType",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EventType",
                table: "Events");
        }
    }
}
