<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| Cobertura del contrato de equipos: creación, validación y regla R1.
| Ejecute: php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create(['nombre' => 'Cómputo']);

    $response = $this->postJson('/api/equipos', [
        'codigo' => 'EQ-1234',
        'nombre' => 'Laptop de prueba',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => '2026-09-15',
        'costo_interno' => 1000,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.codigo', 'EQ-1234')
        ->assertJsonPath('data.categoria', [
            'id' => $categoria->id,
            'nombre' => 'Cómputo',
        ])
        ->assertHeader('Location', route('equipos.show', $response->json('data.id')));

    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-1234']);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $this->postJson('/api/equipos', [
        'codigo' => 'incorrecto',
        'nombre' => 'x',
        'categoria_id' => 999999,
        'estado' => 'prestado',
        'fecha_adquisicion' => '2099-01-01',
        'costo_interno' => -1,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'estado',
            'fecha_adquisicion',
            'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertConflict()
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo' => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
        'estado' => 'prestado',
    ]);
});
