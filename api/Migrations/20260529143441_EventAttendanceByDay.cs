using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouthUnion.Migrations
{
    /// <inheritdoc />
    public partial class EventAttendanceByDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserEventAttendances",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    AttendanceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckedInAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CheckedInBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CheckedOutAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CheckedOutBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserEventAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserEventAttendances_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserEventAttendances_UserEvents_EventId_UserId",
                        columns: x => new { x.EventId, x.UserId },
                        principalTable: "UserEvents",
                        principalColumns: new[] { "EventId", "UserId" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserEventAttendances_EventId_UserId_AttendanceDate",
                table: "UserEventAttendances",
                columns: new[] { "EventId", "UserId", "AttendanceDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserEventAttendances");
        }
    }
}
