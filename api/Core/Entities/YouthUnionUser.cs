using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using THPIdentity.Entities;

namespace YouthUnion.Core.Entities;

public class YouthUnionUser : IdentityUser
{
    [StringLength(2048)]
    public string? Avatar { get; set; }
    public int? DepartmentId { get; set; }
    public UserType UserType { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    [Column(TypeName = "money")]
    public decimal Amount { get; set; }
    public string? Name { get; set; }
    public bool? Gender { get; set; }
    public UserStatus Status { get; set; }
    public int? DistrictId { get; set; }
    public string? CitizenId { get; set; }
}
