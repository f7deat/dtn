using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using YouthUnion.Core.Entities;
using YouthUnion.Entities;

namespace YouthUnion.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<YouthUnionUser, YouthUnionRole, string>(options)
{
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<Article> Articles { get; set; }
    public virtual DbSet<Contest> Contests { get; set; }
    public virtual DbSet<ContestSubmission> ContestSubmissions { get; set; }
    public virtual DbSet<Event> Events { get; set; }
    public virtual DbSet<EventRegistration> EventRegistrations { get; set; }
    public virtual DbSet<UserEvent> UserEvents { get; set; }
    public virtual DbSet<UserEventAttendance> UserEventAttendances { get; set; }
    public virtual DbSet<Department> Departments { get; set; }
    public virtual DbSet<AcademicYear> AcademicYears { get; set; }
    public virtual DbSet<Semester> Semesters { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContestSubmission>()
            .HasIndex(x => new { x.ContestId, x.UserId });
        modelBuilder.Entity<ContestSubmission>()
            .HasOne(x => x.Contest)
            .WithMany(x => x.Submissions)
            .HasForeignKey(x => x.ContestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<UserEvent>().HasKey(x => new { x.EventId, x.UserId });
        modelBuilder.Entity<UserEventAttendance>().HasKey(x => x.Id);
        modelBuilder.Entity<UserEventAttendance>()
            .HasIndex(x => new { x.EventId, x.UserId, x.AttendanceDate })
            .IsUnique();
        modelBuilder.Entity<UserEventAttendance>()
            .HasOne(x => x.UserEvent)
            .WithMany(x => x.Attendances)
            .HasForeignKey(x => new { x.EventId, x.UserId })
            .OnDelete(DeleteBehavior.NoAction);
        base.OnModelCreating(modelBuilder);
    }
}
