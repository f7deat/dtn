using THPCore.Infrastructures;

namespace YouthUnion.Models.Categories;

public class CategoryUpdateRequest : BaseEntity<int>
{
    public string Name { get; set; } = default!;
}
