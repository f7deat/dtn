using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;
using YouthUnion.Core.Entities;

namespace YouthUnion.Entities;

public class Category : BaseEntity<int>
{
    [StringLength(256)]
    public string Name { get; set; } = default!;

    public virtual ICollection<Article>? Articles { get; set; }
}
