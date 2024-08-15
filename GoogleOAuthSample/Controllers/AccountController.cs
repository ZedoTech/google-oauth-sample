using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Google.Apis.Auth;

namespace GoogleOAuthSample.Controllers
{
    public class AccountController : Controller
    {
        [Route("login")]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(string token)
        {
            var (isValid, userId, email, name, avatar) = ValidUser(token);
            if (isValid)
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, name),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Uri, avatar),
                    new Claim(ClaimTypes.Role, "User"),
                    // 可以添加更多的 claims，例如:
                    // new Claim("CustomClaimType", "CustomValue"),
                };

                var claimsIdentity = new ClaimsIdentity(
                    claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var authProperties = new AuthenticationProperties
                {
                    // 可選：設置記住我功能
                    IsPersistent = true,
                    // 可選：設置絕對過期時間
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                return RedirectToAction("Index", "Home");
            }

            ModelState.AddModelError(string.Empty, "Invalid login attempt.");
            return View();
        }

        [Route("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }

        private (bool, string, string, string, string) ValidUser(string token)
        {
            try
            {
                var googleToken = GoogleJsonWebSignature.ValidateAsync(token).Result;
                var userId = googleToken.Subject;
                var email = googleToken.Email;
                var name = googleToken.Name;
                var avatar = googleToken.Picture;
                return (true, userId, email, name, avatar);
            }
            catch (Exception)
            {
                return (false, "", "", "", "");
            }
        }
    }
}
