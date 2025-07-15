using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace YouthUnion.Foundation;

[Authorize]
[Route("[controller]")]
public class BaseController : Controller
{
}
