using Microsoft.EntityFrameworkCore;
using YouthUnion.Entities;

namespace YouthUnion.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<Article> Articles { get; set; }
}
