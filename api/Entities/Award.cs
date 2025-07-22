using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Entities;

public class Award : AuditEntity
{
    [StringLength(256)]
    public string UserName { get; set; } = default!;
}
