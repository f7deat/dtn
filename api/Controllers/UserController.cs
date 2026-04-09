using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using THPCore.Constants;
using THPCore.Interfaces;
using THPCore.Models;
using THPIdentity.Entities;
using YouthUnion.API.Models.Students;
using YouthUnion.Core.ExternalAPI.Interfaces;
using YouthUnion.Foundation;

namespace YouthUnion.API.Controllers;

public class UserController(IIdentityAPI _identityAPI, UserManager<ApplicationUser> _userManager, IConfiguration _configuration, IHCAService _hcaService) : BaseController
{
    [HttpPost("login"), AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginArgs args)
    {
        if (string.IsNullOrWhiteSpace(args.UserName) || string.IsNullOrWhiteSpace(args.Password)) return Ok(THPResult.Failed("Vui lòng nhập tên đăng nhập hoặc mật khẩu!"));
        var api = await _identityAPI.LoginAsync(args.UserName, args.Password);
        if (!api.Succeeded) return Ok(api);
        var user = await _userManager.FindByNameAsync(args.UserName);
        if (user is null)
        {
            if (api.Data is null) return Ok(THPResult.Failed("Không tìm thấy dữ liệu đồng bộ!"));
            user = new ApplicationUser
            {
                Id = api.Data.Id,
                UserName = args.UserName,
                Email = api.Data.Email,
                PhoneNumber = api.Data.PhoneNumber,
                Name = api.Data.Name,
                DateOfBirth = api.Data.DateOfBirth,
                Gender = api.Data.Gender,
                DepartmentId = api.Data.DepartmentId,
                Avatar = api.Data.Avatar,
                UserType = api.Data.UserType,
                Status = UserStatus.Active
            };
            var cResult = await _userManager.CreateAsync(user, args.Password);
            if (!cResult.Succeeded) return Ok(THPResult.Failed(cResult.Errors.FirstOrDefault()?.Description ?? ""));
            await _userManager.AddToRoleAsync(user, RoleName.Student);
        }
        user = await _userManager.FindByNameAsync(args.UserName);
        if (user is null) return Ok(THPResult.Failed("Đăng nhập thất bại!"));
        if (await _userManager.IsInRoleAsync(user, RoleName.Student) || user.UserType == UserType.Student) return Ok(THPResult.Failed("Đăng nhập thất bại!"));
        var userRoles = await _userManager.GetRolesAsync(user);

        var authClaims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString(), ClaimValueTypes.String),
                new(ClaimTypes.Name, user.UserName ?? string.Empty, ClaimValueTypes.String),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

        foreach (var userRole in userRoles)
        {
            authClaims.Add(new Claim(ClaimTypes.Role, userRole, ClaimValueTypes.String));
        }

        var secretCode = _configuration["JWT:Secret"];
        if (string.IsNullOrEmpty(secretCode)) return Ok(THPResult.Failed($"Secret code not found!"));

        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretCode));

        var token = new JwtSecurityToken(
            expires: DateTime.Now.AddDays(7),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

        var generatedToken = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(THPResult.Ok(generatedToken));
    }

    [HttpGet]
    public async Task<IActionResult> CurrentAsync()
    {
        var userId = _hcaService.GetUserId();
        if (string.IsNullOrEmpty(userId)) return Ok(THPResult.Failed("User not found!"));
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Ok(THPResult.Failed("User not found!"));
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(THPResult.Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.PhoneNumber,
            user.Name,
            user.DateOfBirth,
            user.Gender,
            user.DepartmentId,
            user.Avatar,
            user.UserType,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed,
            roles
        }));
    }
}
