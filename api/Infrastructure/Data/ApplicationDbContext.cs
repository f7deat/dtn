using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using YouthUnion.Core.Entities;
using YouthUnion.Entities;

namespace YouthUnion.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<YouthUnionUser, YouthUnionRole, string>(options)
{
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<Article> Articles { get; set; }
    public virtual DbSet<Event> Events { get; set; }
    public virtual DbSet<EventRegistration> EventRegistrations { get; set; }
    public virtual DbSet<UserEvent> UserEvents { get; set; }
    public virtual DbSet<Department> Departments { get; set; }
    public virtual DbSet<AcademicYear> AcademicYears { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEvent>().HasKey(x => new { x.EventId, x.UserId });
        base.OnModelCreating(modelBuilder);
    }
}
