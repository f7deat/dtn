using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using YouthUnion.Entities;

namespace YouthUnion.Data;

public class IdentityDbTHPContext(DbContextOptions<IdentityDbTHPContext> options) : IdentityDbContext<ApplicationUser>(options)
{
}
