using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class Department : BaseEntity<int>
{
    [StringLength(256)]
    public string Name { get; set; } = default!;
}
