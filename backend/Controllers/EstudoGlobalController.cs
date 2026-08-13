using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstudoGlobalController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EstudoGlobalController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<EstudoGlobal>> GetGlobal()
        {
            var global = await _context.EstudosGlobais.FirstOrDefaultAsync();

            // Cria o resumo inicial caso ainda não exista:
            if (global == null)
            {
                global = new EstudoGlobal
                {
                    HorasHoje = 0,
                    HorasTotais = 0,
                    MetaHorasSemanal = 0,
                    UltimoReset = null,
                    UltimoResetSemanal = null,
                    UltimaAtualizacao = DateTime.UtcNow
                };

                _context.EstudosGlobais.Add(global);
                await _context.SaveChangesAsync();
            }

            return Ok(global);
        }

        // PUT:
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGlobal(
            int id,
            EstudoGlobal global)
        {
            if (id != global.Id) return BadRequest();

            var globalExistente = await _context.EstudosGlobais.FindAsync(id);

            if (globalExistente == null) return NotFound();

            globalExistente.HorasHoje = global.HorasHoje;
            globalExistente.HorasTotais = global.HorasTotais;
            globalExistente.MetaHorasSemanal = global.MetaHorasSemanal;
            globalExistente.UltimoReset = global.UltimoReset;
            globalExistente.UltimoResetSemanal = global.UltimoResetSemanal;
            globalExistente.UltimaAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(globalExistente);
        }
    }
}