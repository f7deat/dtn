using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace YouthUnion.Core.Entities;

public class YouthUnionRole : IdentityRole
{
    [StringLength(255)]
    public string? DisplayName { get; set; }
}
